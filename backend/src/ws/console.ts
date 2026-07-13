import type { IncomingMessage } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import { Client } from "ssh2";
import jwt from "jsonwebtoken";
import type { Server } from "http";
import { isValidObjectId } from "mongoose";
import { env } from "../config/env";
import { AUTH_COOKIE, type TokenPayload } from "../services/auth";
import { MachineModel } from "../models/Machine";
import { decryptSecret } from "../lib/crypto";

interface ResizeMessage {
  type: "resize";
  cols: number;
  rows: number;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    map[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return map;
}

function parseMachineId(pathname: string): string | null {
  const match = pathname.match(/\/api\/ws\/console\/([^/]+)/);
  return match?.[1] ?? null;
}

function sendError(ws: WebSocket, message: string): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type: "error", message }));
  }
}

function setupSSHSession(ws: WebSocket, machine: {
  rdpHost: string;
  sshPort: number;
  rdpUser: string;
  rdpPassword: string;
}): void {
  const conn = new Client();
  let cols = 80;
  let rows = 24;

  conn.on("ready", () => {
    conn.shell({ term: "xterm-256color", cols, rows }, (err, stream) => {
      if (err) {
        sendError(ws, `SSH shell failed: ${err.message}`);
        conn.end();
        return;
      }

      ws.on("message", (raw) => {
        try {
          const data = raw.toString("utf-8");
          try {
            const msg = JSON.parse(data) as ResizeMessage;
            if (msg.type === "resize" && typeof msg.cols === "number" && typeof msg.rows === "number") {
              cols = msg.cols;
              rows = msg.rows;
              stream.setWindow(msg.rows, msg.cols, 0, 0);
              return;
            }
          } catch {
            // not JSON, forward as raw terminal input
          }
          stream.write(data);
        } catch {
          // ignore malformed frames
        }
      });

      stream.on("data", (data: Buffer) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(data.toString("utf-8"));
        }
      });

      stream.stderr.on("data", (data: Buffer) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(data.toString("utf-8"));
        }
      });

      stream.on("close", () => {
        conn.end();
        if (ws.readyState === ws.OPEN) ws.close();
      });
    });
  });

  conn.on("error", (err) => {
    sendError(ws, `SSH connection failed: ${err.message}`);
    if (ws.readyState === ws.OPEN) ws.close();
  });

  conn.connect({
    host: machine.rdpHost,
    port: machine.sshPort,
    username: machine.rdpUser,
    password: machine.rdpPassword,
    readyTimeout: 10000,
    keepaliveInterval: 30000,
  });
}

export function setupConsoleWebSocket(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (request: IncomingMessage, socket, head) => {
    const pathname = request.url ?? "";

    if (!pathname.startsWith("/api/ws/console")) {
      socket.destroy();
      return;
    }

    const machineId = parseMachineId(pathname);
    if (!machineId || !isValidObjectId(machineId)) {
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
      socket.destroy();
      return;
    }

    const cookies = parseCookies(request.headers.cookie ?? "");
    const token = cookies[AUTH_COOKIE];
    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
    } catch {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    if (payload.role !== "admin") {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }

    let machine;
    try {
      machine = await MachineModel.findById(machineId);
    } catch {
      socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
      socket.destroy();
      return;
    }

    if (!machine) {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      setupSSHSession(ws, {
        rdpHost: machine.rdpHost,
        sshPort: machine.sshPort ?? 22,
        rdpUser: machine.rdpUser,
        rdpPassword: decryptSecret(machine.rdpPassword),
      });
    });
  });
}
