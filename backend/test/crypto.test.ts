import { describe, it, expect } from "vitest";
import { encryptSecret, decryptSecret } from "../src/lib/crypto";

describe("crypto: encryptSecret / decryptSecret", () => {
  it("round-trips a plaintext string losslessly", () => {
    const plain = "s3cr3t-rdp-password!";
    const encrypted = encryptSecret(plain);
    expect(decryptSecret(encrypted)).toBe(plain);
  });

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    const plain = "same-password";
    const a = encryptSecret(plain);
    const b = encryptSecret(plain);
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe(plain);
    expect(decryptSecret(b)).toBe(plain);
  });

  it("throws when decrypting a tampered payload", () => {
    const encrypted = encryptSecret("another-password");
    const [iv, authTag, ciphertext] = encrypted.split(":");
    // Flip the ciphertext to simulate tampering.
    const tamperedCiphertext = Buffer.from(ciphertext, "base64");
    tamperedCiphertext[0] ^= 0xff;
    const tampered = [iv, authTag, tamperedCiphertext.toString("base64")].join(":");

    expect(() => decryptSecret(tampered)).toThrow();
  });
});
