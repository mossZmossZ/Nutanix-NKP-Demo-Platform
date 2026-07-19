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
  // IANA timezone that defines the "day" boundary for per-user active-time accounting, so
  // "today" on the admin dashboard matches the admin's local midnight (not UTC's 07:00 here).
  workshopTz: process.env.WORKSHOP_TZ ?? "Asia/Bangkok",
};

export const isProd = env.nodeEnv === "production";

// Fail fast in production if any secret protecting data at rest or in transit is
// unset or still a dev placeholder. CREDENTIAL_SECRET is especially load-bearing:
// it derives the AES key for stored passwords, so if it changes (or silently falls
// back to the dev default) every encrypted value becomes undecryptable. A
// misconfigured prod must never boot silently. See SECURITY.md.
if (isProd) {
  const devDefaults: Record<string, string> = {
    JWT_SECRET: "dev-secret-change-me",
    CREDENTIAL_SECRET: "dev-credential-secret-change-me",
    GUAC_TOKEN_SECRET: "dev-guac-token-secret-change-me",
  };
  const insecure = Object.entries(devDefaults)
    .filter(([name, devDefault]) => {
      const value = process.env[name];
      return !value || value.trim() === "" || value === devDefault;
    })
    .map(([name]) => name);
  if (insecure.length > 0) {
    throw new Error(
      `Refusing to start in production: ${insecure.join(", ")} is unset or a dev default. ` +
        `Set a strong unique value for each (generate with: openssl rand -base64 32).`,
    );
  }
}
