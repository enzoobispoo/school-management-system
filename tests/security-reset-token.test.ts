import { describe, expect, it } from "vitest";
import { hashPasswordResetToken } from "@/lib/security/reset-token-hash";

describe("hashPasswordResetToken", () => {
  it("é determinístico e hex de 64 chars", () => {
    const raw = "sample-token-unificado-teste";
    expect(hashPasswordResetToken(raw)).toBe(hashPasswordResetToken(raw));
    expect(hashPasswordResetToken(raw)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("diferencia tokens diferentes", () => {
    expect(hashPasswordResetToken("a")).not.toBe(hashPasswordResetToken("b"));
  });
});
