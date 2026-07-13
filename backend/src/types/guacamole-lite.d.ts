// Minimal ambient types for guacamole-lite (ships no types). Only what the RDP
// tunnel (src/ws/rdp.ts) uses: the constructor and the underlying ws server we
// drive manually via handleUpgrade + emit('connection').
declare module "guacamole-lite" {
  import type { WebSocketServer } from "ws";

  interface GuacdOptions {
    host?: string;
    port?: number;
  }

  interface ClientOptions {
    crypt: { cypher: string; key: Buffer | string };
    log?: { level?: string };
    // Applied to every connection's settings (e.g. shared RDP defaults).
    connectionDefaultSettings?: Record<string, Record<string, unknown>>;
  }

  class GuacamoleLite {
    constructor(
      wsOptions: { server?: unknown; noServer?: boolean; port?: number },
      guacdOptions: GuacdOptions,
      clientOptions: ClientOptions,
    );
    webSocketServer: WebSocketServer;
  }

  export = GuacamoleLite;
}
