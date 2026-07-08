import { createApp } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import { seedAdmin } from "./services/auth";

async function main(): Promise<void> {
  await connectDb();
  await seedAdmin();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`API listening on :${env.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
