import { useEffect, useRef, useCallback, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import "@xterm/xterm/css/xterm.css";

type Props = {
  machineId: string;
  onDisconnected: () => void;
};

export function ConsoleTerminal({ machineId, onDisconnected }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "error" | "disconnected">("connecting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const connectingRef = useRef(true);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (termRef.current) {
      termRef.current.dispose();
      termRef.current = null;
    }
    onDisconnected();
  }, [onDisconnected]);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
      theme: {
        background: "#1a1b26",
        foreground: "#c0caf5",
        cursor: "#c0caf5",
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const container = containerRef.current!;

    const sizeObserver = new ResizeObserver(() => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        if (!term.element) {
          term.open(container);
        }
        fitAddon.fit();
      }
    });
    sizeObserver.observe(container);

    const ws = new WebSocket(
      `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/api/ws/console/${machineId}`,
    );
    wsRef.current = ws;
    connectingRef.current = true;

    ws.onopen = () => {
      connectingRef.current = false;
      setStatus("connected");
      setErrorMsg(null);
      if (container.clientWidth > 0) fitAddon.fit();
      term.focus();
    };

    ws.onmessage = (e) => {
      if (typeof e.data !== "string") return;
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "error") {
          setStatus("error");
          setErrorMsg(msg.message as string);
          return;
        }
      } catch {
        term.write(e.data);
      }
    };

    ws.onerror = () => {
      if (connectingRef.current) {
        setStatus("error");
        setErrorMsg("WebSocket connection failed");
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      term.write("\r\n\x1b[31m\x1b[1mSession closed\x1b[0m\r\n");
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    });

    return () => {
      sizeObserver.disconnect();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      term.dispose();
    };
  }, [machineId]);

  if (status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">Connection failed</p>
          <p className="mt-1 text-sm text-muted-foreground">{errorMsg || "Unknown error"}</p>
        </div>
        <Button variant="secondary" onClick={disconnect}>
          Close
        </Button>
      </div>
    );
  }

  if (status === "disconnected") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted-foreground/10 text-muted-foreground">
          <AlertTriangle className="size-7" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">Session ended</p>
          <p className="mt-1 text-sm text-muted-foreground">The SSH connection was closed.</p>
        </div>
        <Button variant="secondary" onClick={disconnect}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {status === "connecting" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#1a1b26]">
          <Loader2 className="size-6 animate-spin text-violet-400" />
          <p className="text-sm text-violet-300/80">Connecting to {machineId}…</p>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
