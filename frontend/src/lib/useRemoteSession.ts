import { useCallback, useEffect, useRef, useState } from "react"
import Guacamole from "guacamole-common-js"

export type RemoteState = "connecting" | "connected" | "disconnected" | "error"

// Guacamole.Client.State numeric values (stable across versions — safer than
// depending on the enum const existing at runtime).
const STATE_CONNECTED = 3
const STATE_DISCONNECTED = 5

// RDP negotiates the desktop on aligned pixel dimensions, so an unaligned
// request can round *up* — making the framebuffer taller/wider than the pane so
// its bottom edge (the Linux taskbar) is clipped by the host's overflow:hidden.
// Floor to a 4px boundary so the negotiated size never exceeds the pane; the
// desktop sits top-left with at most a ~3px inert margin instead of clipping.
const fitRemote = (px: number) => Math.floor(px / 4) * 4

// Guacamole clipboard blobs are base64. btoa/atob are Latin1-only — raw btoa
// THROWS on any non-ASCII char (curly quotes, em-dashes, accents), which would
// silently drop a paste and leave stale text on the remote. Round-trip through
// UTF-8 bytes on both sides so multibyte content survives intact.
const encodeClipboard = (text: string) => {
  const bytes = new TextEncoder().encode(text)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}
const decodeClipboard = (binary: string) =>
  new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))

export interface RemoteSession {
  state: RemoteState
  errorMessage: string | null
  /** Ref callback for the visible pane — re-parents the persistent canvas into it. */
  attach: (el: HTMLDivElement | null) => void
  reconnect: () => void
  disconnect: () => void
}

// Owns one live RDP session for a lab. The canvas lives in a React-EXTERNAL
// <div> (hostRef) so it survives React remounts: flipping to Credentials or
// crossing the responsive breakpoint unmounts <RemotePanel>, but the host node
// is only re-parented (appendChild), never destroyed — the session stays live.
// Mouse/keyboard bind once to the persistent host and forward to the current
// client, so reconnects don't leak duplicate listeners.
export function useRemoteSession(slug: string | undefined): RemoteSession {
  const [state, setState] = useState<RemoteState>("connecting")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const hostRef = useRef<HTMLDivElement | null>(null)
  const clientRef = useRef<Guacamole.Client | null>(null)
  const remoteClipboardRef = useRef("")

  // Create the persistent host node once (synchronously, before first attach).
  if (hostRef.current === null && typeof document !== "undefined") {
    const el = document.createElement("div")
    el.style.width = "100%"
    el.style.height = "100%"
    el.style.overflow = "hidden"
    el.style.outline = "none"
    // Guacamole layers carry z-index:-1; without a local stacking context they
    // paint BEHIND ancestor backgrounds (invisible desktop, cursor still shows
    // because its transform isolates it). Contain them here.
    el.style.isolation = "isolate"
    el.style.cursor = "none" // guacd draws the remote cursor
    el.tabIndex = 0
    hostRef.current = el
  }

  // Remote → local: mirror the remote's clipboard to the OS clipboard so a copy
  // inside the desktop is available locally. Best-effort: the browser may reject
  // writeText when the tab isn't focused. Guarded to only write on a GENUINE
  // change — RDP re-broadcasts its clipboard on focus/reconnect, and writing an
  // unchanged value on those events would clobber whatever the user just copied
  // locally. Empty values are skipped so a blank remote clipboard never clears
  // the local one.
  function bufferRemoteClipboard(stream: Guacamole.InputStream) {
    // Accumulate raw bytes across blobs, then UTF-8 decode once — a multibyte
    // char can straddle a blob boundary, so decoding per-blob would mangle it.
    let binary = ""
    stream.onblob = (data64: string) => {
      binary += atob(data64)
    }
    stream.onend = () => {
      const text = decodeClipboard(binary)
      if (!text || text === remoteClipboardRef.current) return
      remoteClipboardRef.current = text
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  function sendLocalClipboardToRemote(client: Guacamole.Client) {
    navigator.clipboard.readText().then((text) => {
      if (!text) return
      const stream = client.createClipboardStream("text/plain")
      stream.sendBlob(encodeClipboard(text))
      stream.sendEnd()
    }).catch(() => {})
  }

  const connect = useCallback(() => {
    const host = hostRef.current
    if (!host || !slug) return

    clientRef.current?.disconnect()

    // 1:1 fit-to-pane: ask guacd for the current pane's pixel size (floored to a
    // 4px boundary — see fitRemote). Fallback to a sane default if the host is
    // momentarily detached (0×0).
    const w = Math.max(fitRemote(host.clientWidth) || 1280, 320)
    const h = Math.max(fitRemote(host.clientHeight) || 720, 240)

    const proto = window.location.protocol === "https:" ? "wss" : "ws"
    const tunnel = new Guacamole.WebSocketTunnel(`${proto}://${window.location.host}/api/ws/rdp`)
    const client = new Guacamole.Client(tunnel)
    clientRef.current = client

    setState("connecting")
    setErrorMessage(null)

    client.onstatechange = (s) => {
      if (s === STATE_CONNECTED) setState("connected")
      else if (s === STATE_DISCONNECTED) setState((p) => (p === "error" ? p : "disconnected"))
      else setState((p) => (p === "error" ? p : "connecting"))
    }
    client.onerror = (status) => {
      setErrorMessage(status?.message ?? "Connection error")
      setState("error")
      client.disconnect()
    }
    client.onclipboard = (clipboardStream: Guacamole.InputStream) => {
      bufferRemoteClipboard(clipboardStream)
    }

    host.replaceChildren(client.getDisplay().getElement())
    // Query is appended to the tunnel URL; the backend reads lab/size and mints
    // the guacd token server-side (never sent from the browser).
    client.connect(`lab=${encodeURIComponent(slug)}&width=${w}&height=${h}&dpi=96`)
  }, [slug])

  // Bind input once to the persistent host; handlers read the CURRENT client.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const mouse = new Guacamole.Mouse(host)
    mouse.onEach(["mousedown", "mousemove", "mouseup"], (e) => {
      clientRef.current?.sendMouseState((e as Guacamole.Mouse.Event).state, true)
    })
    const keyboard = new Guacamole.Keyboard(host)
    keyboard.onkeydown = (keysym) => {
      clientRef.current?.sendKeyEvent(1, keysym)
      return false
    }
    keyboard.onkeyup = (keysym) => {
      clientRef.current?.sendKeyEvent(0, keysym)
    }
    // Local → remote paste: on right-click, push the local clipboard to the
    // remote BEFORE its native context menu's "Paste" is chosen. We don't
    // preventDefault — the right-click still flows to guacd (Guacamole blocks
    // the browser's own context menu) so the remote menu opens as usual. Using
    // a keyboard shortcut here is unsafe: the keystrokes also reach the remote
    // and, in a terminal, Ctrl+Shift+V is itself paste — racing a stale value.
    const onRightMouseDown = (e: MouseEvent) => {
      if (e.button !== 2) return
      const client = clientRef.current
      if (client) sendLocalClipboardToRemote(client)
    }
    host.addEventListener("mousedown", onRightMouseDown)
    // Focus the canvas on pointer-down so key events reach the scoped Keyboard
    // (and NOT the document — nothing leaks while on the Credentials tab).
    const focus = () => host.focus()
    host.addEventListener("pointerdown", focus)
    return () => {
      host.removeEventListener("pointerdown", focus)
      host.removeEventListener("mousedown", onRightMouseDown)
    }
  }, [])

  // Keep the remote desktop 1:1 with the visible pane. When the pane resizes
  // (window resize, splitter drag, responsive breakpoint flip) guacd would keep
  // rendering at the connect-time resolution; ask it to re-render at the new
  // pixel size instead. Debounced so a drag doesn't spam guacd.
  useEffect(() => {
    const host = hostRef.current
    if (!host || typeof ResizeObserver === "undefined") return
    let timer: ReturnType<typeof setTimeout> | undefined
    const observer = new ResizeObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const client = clientRef.current
        if (!client) return
        // 0×0 means the host is detached (Credentials tab / breakpoint remount) —
        // don't shrink the live desktop while it's hidden; keep the last size.
        if (host.clientWidth < 1 || host.clientHeight < 1) return
        const w = Math.max(fitRemote(host.clientWidth), 320)
        const h = Math.max(fitRemote(host.clientHeight), 240)
        try {
          client.sendSize(w, h)
        } catch {
          // Tunnel not open yet (still connecting) — the connect-time size stands.
        }
      }, 200)
    })
    observer.observe(host)
    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  // Auto-connect once; reconnect on lab change; tear down on unmount.
  useEffect(() => {
    connect()
    return () => {
      clientRef.current?.disconnect()
      clientRef.current = null
    }
  }, [connect])

  const attach = useCallback((el: HTMLDivElement | null) => {
    const host = hostRef.current
    if (el && host && host.parentElement !== el) el.appendChild(host)
  }, [])

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect()
    setState("disconnected")
  }, [])

  return { state, errorMessage, attach, reconnect: connect, disconnect }
}
