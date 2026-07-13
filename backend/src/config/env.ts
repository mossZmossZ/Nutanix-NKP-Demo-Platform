import "dotenv/config";
import path from "path";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required("MONGO_URI", "mongodb://localhost:27017/nkp-workshop"),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  // Static admin, upserted from env on every boot (env is the source of truth).
  adminUser: required("ADMIN_USER", "admin"),
  adminPassword: required("ADMIN_PASSWORD", "changeme"),
  // AES-256-GCM key material for encrypting RDP credentials at rest (see src/lib/crypto.ts).
  credentialSecret: process.env.CREDENTIAL_SECRET ?? "dev-credential-secret-change-me",
  // guacd (renders RDP) — the WS tunnel connects here. Backend runs on the host in dev,
  // so guacd is reached via the published localhost port; guacd reaches the RDP host itself.
  guacdHost: process.env.GUACD_HOST ?? "localhost",
  guacdPort: Number(process.env.GUACD_PORT ?? 4822),
  // Secret for the short-lived guacamole-lite connection token. The token is minted AND
  // consumed server-side inside the WS upgrade (never sent to the browser); this only needs
  // to be stable within the process. Hashed to a 32-byte AES key in the tunnel.
  guacTokenSecret: process.env.GUAC_TOKEN_SECRET ?? "dev-guac-token-secret-change-me",
  // Filesystem root for lab guide content (wiki/<slug>/NN-*.md), resolved from this file's
  // location so it's stable regardless of process.cwd() (differs between `npm run dev` and tests).
  wikiDir: process.env.WIKI_DIR ?? path.resolve(__dirname, "../../../wiki"),
};

export const isProd = env.nodeEnv === "production";
