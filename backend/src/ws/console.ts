import type { IncomingMessage } from "http";
import type { Duplex } from "stream";
import { WebSocketServer, type WebSocket } from "ws";
import { Client } from "ssh2";
import { isValidObjectId } from "mongoose";
import { MachineModel } from "../models/Machine";
import { decryptSecret } from "../lib/crypto";
import { authenticateUpgrade } from "./auth";

interface ResizeMessage {
  type: "resize";
  cols: number;
  rows: number;
}

const wss = new WebSocketServer({ noServer: true });

function parseMachineId(pathname: string): string | null {
  const match = pathname.match(/\/api\/ws\/console\/([^/]+)/);
  return match?.[1] ?? null;
}

function sendError(ws: WebSocket, message: string): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type: "error", message }));
  }
}

function reject(socket: Duplex, status: number, reason: string): void {
  socket.write(`HTTP/1.1 ${status} ${reason}\r\n\r\n`);
  socket.destroy();
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

// Handles WS upgrades at /api/ws/console/:machineId. Admin-only SSH console.
export async function handleConsoleUpgrade(
  request: IncomingMessage,
  socket: Duplex,
  head: Buffer,
): Promise<void> {
  const machineId = parseMachineId(request.url ?? "");
  if (!machineId || !isValidObjectId(machineId)) return reject(socket, 400, "Bad Request");

  const payload = authenticateUpgrade(request);
  if (!payload) return reject(socket, 401, "Unauthorized");
  if (payload.role !== "admin") return reject(socket, 403, "Forbidden");

  let machine;
  try {
    machine = await MachineModel.findById(machineId);
  } catch {
    return reject(socket, 500, "Internal Server Error");
  }
  if (!machine) return reject(socket, 404, "Not Found");

  wss.handleUpgrade(request, socket, head, (ws) => {
    setupSSHSession(ws, {
      rdpHost: machine.rdpHost,
      sshPort: machine.sshPort ?? 22,
      rdpUser: machine.rdpUser,
      rdpPassword: decryptSecret(machine.rdpPassword),
    });
  });
}
