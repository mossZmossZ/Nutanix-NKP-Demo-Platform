import crypto from "crypto";
import type { IncomingMessage } from "http";
import type { Duplex } from "stream";
import GuacamoleLite from "guacamole-lite";
import { env } from "../config/env";
import { LabModel } from "../models/Lab";
import { AssignmentModel } from "../models/Assignment";
import { decryptSecret } from "../lib/crypto";
import { authenticateUpgrade } from "./auth";

// 32-byte AES key for the guacamole-lite connection token, derived from the
// configured secret. The token is minted AND consumed here (never sent to the
// browser); guacamole-lite decrypts it with this same key.
const GUAC_KEY = crypto.createHash("sha256").update(env.guacTokenSecret).digest();

// guacamole-lite in noServer mode: we own the HTTP upgrade (cookie auth +
// assignment lookup), then hand the socket to its ws server. It talks to guacd.
// NB: the explicit `server: undefined` is required — guacamole-lite only skips
// injecting a default `port: 8080` when the ws options object HAS a `server`
// key, and ws treats an undefined server as noServer. Without it, ws would open
// an unauthenticated listener on :8080 instead of pure noServer mode.
const guacServer = new GuacamoleLite(
  { noServer: true, server: undefined },
  { host: env.guacdHost, port: env.guacdPort },
  { crypt: { cypher: "AES-256-CBC", key: GUAC_KEY } },
);

// Mint a guacamole-lite token (documented format: base64 of {iv, value} JSON,
// value = AES-256-CBC base64). Symmetric with guacamole-lite's own Crypt.decrypt.
function encryptToken(value: unknown): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", GUAC_KEY, iv);
  const encrypted = cipher.update(JSON.stringify(value), "utf8", "base64") + cipher.final("base64");
  const data = { iv: iv.toString("base64"), value: encrypted };
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

function reject(socket: Duplex, status: number, reason: string): void {
  socket.write(`HTTP/1.1 ${status} ${reason}\r\n\r\n`);
  socket.destroy();
}

// Positive integer query param (screen dimensions) or undefined.
function dim(params: URLSearchParams, key: string): string | undefined {
  const raw = params.get(key);
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? String(n) : undefined;
}

// Handles WS upgrades at /api/ws/rdp?lab=<slug>[&width&height&dpi]. Cookie-authed;
// only the assignee of that lab reaches their own machine's desktop.
export async function handleRdpUpgrade(
  request: IncomingMessage,
  socket: Duplex,
  head: Buffer,
): Promise<void> {
  const payload = authenticateUpgrade(request);
  if (!payload) return reject(socket, 401, "Unauthorized");

  const url = new URL(request.url ?? "", "http://localhost");
  const slug = url.searchParams.get("lab");
  if (!slug) return reject(socket, 400, "Bad Request");

  let assignment;
  try {
    const lab = await LabModel.findOne({ slug });
    if (!lab) return reject(socket, 403, "Forbidden");
    assignment = await AssignmentModel.findOne({ userId: payload.id, labId: lab._id }).populate(
      "machineId",
    );
  } catch {
    return reject(socket, 500, "Internal Server Error");
  }
  if (!assignment) return reject(socket, 403, "Forbidden");

  const machine = assignment.machineId as unknown as {
    rdpHost: string;
    rdpPort: number;
    rdpUser: string;
    rdpPassword: string;
  };

  const settings: Record<string, string> = {
    hostname: machine.rdpHost,
    port: String(machine.rdpPort ?? 3389),
    username: machine.rdpUser,
    password: decryptSecret(machine.rdpPassword),
    // TLS. xrdp's default "negotiate" layer refuses both FreeRDP "any" (tries
    // NLA first) and plain "rdp" ("wrong security type") — it wants TLS. xrdp's
    // self-signed cert is accepted via ignore-cert.
    security: "tls",
    "ignore-cert": "true",
    // guacd defaults to 16-bit color, at which Windows renders a black
    // framebuffer to FreeRDP (cursor draws, desktop never paints). 24-bit fixes it.
    "color-depth": "24",
    // Live fit-to-pane where the RDP server supports it (Phase 5 decision 5).
    "resize-method": "display-update",
  };
  const width = dim(url.searchParams, "width");
  const height = dim(url.searchParams, "height");
  const dpi = dim(url.searchParams, "dpi");
  if (width) settings.width = width;
  if (height) settings.height = height;
  if (dpi) settings.dpi = dpi;

  const token = encryptToken({ connection: { type: "rdp", settings } });
  // guacamole-lite reads the token from the request URL query on 'connection'.
  // We put it here server-side; it never traversed the browser.
  request.url = `/?token=${encodeURIComponent(token)}`;

  guacServer.webSocketServer.handleUpgrade(request, socket, head, (ws) => {
    guacServer.webSocketServer.emit("connection", ws, request);
  });
}
