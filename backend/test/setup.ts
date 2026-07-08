/*
 * Runs before any test module loads (vitest setupFiles), so these env vars are
 * in place when src/config/env.ts is first imported. Tests connect mongoose to
 * an in-memory server via the harness; MONGO_URI here is only a placeholder.
 */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.ADMIN_USER = "admin";
process.env.ADMIN_PASSWORD = "admin-pass-123";
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/unused";
