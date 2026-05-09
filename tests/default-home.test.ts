import { describe, expect, it } from "vitest";
import { defaultHomePathForRole } from "@/lib/navigation/default-home";

describe("defaultHomePathForRole", () => {
  it("envia cada papel ao hub esperado", () => {
    expect(defaultHomePathForRole("SUPER_ADMIN")).toBe("/admin");
    expect(defaultHomePathForRole("PROFESSOR")).toBe("/docente");
    expect(defaultHomePathForRole("FINANCEIRO")).toBe("/financeiro");
    expect(defaultHomePathForRole("SECRETARIA")).toBe("/secretaria");
    expect(defaultHomePathForRole("SECRETARIA_FINANCEIRA")).toBe("/secretaria");
    expect(defaultHomePathForRole("ADMIN")).toBe("/");
    expect(defaultHomePathForRole(undefined)).toBe("/");
    expect(defaultHomePathForRole(null)).toBe("/");
  });
});
