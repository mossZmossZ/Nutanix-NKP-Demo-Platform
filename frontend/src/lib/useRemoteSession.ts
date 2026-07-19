import { useCallback, useEffect, useRef, useState } from "react"
import Guacamole from "guacamole-common-js"

export type RemoteState = "connecting" | "connected" | "disconnected" | "error"

// Guacamole.Client.State numeric values (stable across versions — safer than
// depending on the enum const existing at runtime).
const STATE_CONNECTED = 3
const STATE_DISCONNECTED = 5

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

  function bufferRemoteClipboard(stream: Guacamole.InputStream) {
    let data = ""
    stream.onblob = (data64: string) => {
      data += atob(data64)
    }
    stream.onend = () => {
      remoteClipboardRef.current = data
      navigator.clipboard.writeText(data).catch(() => {})
    }
  }

  function sendLocalClipboardToRemote(client: Guacamole.Client) {
    navigator.clipboard.readText().then((text) => {
      if (!text) return
      const stream = client.createClipboardStream("text/plain")
      stream.sendBlob(btoa(text))
      stream.sendEnd()
    }).catch(() => {})
  }

  const connect = useCallback(() => {
    const host = hostRef.current
    if (!host || !slug) return

    clientRef.current?.disconnect()

    // 1:1 fit-to-pane: ask guacd for the current pane's pixel size. Fallback to
    // a sane default if the host is momentarily detached (0×0).
    const w = Math.max(Math.round(host.clientWidth) || 1280, 320)
    const h = Math.max(Math.round(host.clientHeight) || 720, 240)

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
    const onClipboardKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey || !e.shiftKey) return
      const client = clientRef.current
      if (!client) return
      if (e.code === "KeyV") {
        e.preventDefault()
        e.stopPropagation()
        sendLocalClipboardToRemote(client)
      } else if (e.code === "KeyC") {
        e.preventDefault()
        e.stopPropagation()
        const text = remoteClipboardRef.current
        if (text) navigator.clipboard.writeText(text).catch(() => {})
      }
    }
    host.addEventListener("keydown", onClipboardKey, { capture: true })
    // Focus the canvas on pointer-down so key events reach the scoped Keyboard
    // (and NOT the document — nothing leaks while on the Credentials tab).
    const focus = () => host.focus()
    host.addEventListener("pointerdown", focus)
    return () => {
      host.removeEventListener("pointerdown", focus)
      host.removeEventListener("keydown", onClipboardKey, { capture: true })
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
        const w = Math.max(Math.round(host.clientWidth), 320)
        const h = Math.max(Math.round(host.clientHeight), 240)
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
