import http from "http";
import { createApp } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import { seedAdmin } from "./services/auth";
import { handleConsoleUpgrade } from "./ws/console";
import { handleRdpUpgrade } from "./ws/rdp";

async function main(): Promise<void> {
  await connectDb();
  await seedAdmin();

  const app = createApp();
  const server = http.createServer(app);

  // Single WS upgrade router — Node fires every 'upgrade' listener, so all
  // routing lives here (one handler destroying unmatched paths, as each did
  // before, would kill the others' sockets). Handlers own their own auth.
  server.on("upgrade", (request, socket, head) => {
    const pathname = request.url ?? "";
    if (pathname.startsWith("/api/ws/console")) {
      void handleConsoleUpgrade(request, socket, head);
    } else if (pathname.startsWith("/api/ws/rdp")) {
      void handleRdpUpgrade(request, socket, head);
    } else {
      socket.destroy();
    }
  });

  server.listen(env.port, () => {
    console.log(`API listening on :${env.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
