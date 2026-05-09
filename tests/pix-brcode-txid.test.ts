import { describe, expect, it } from "vitest";
import { extractPixTxIdFromBrCode, extractPixTxIdsFromBrCodes } from "@/lib/pluggy/pix-brcode-txid";

describe("extractPixTxIdFromBrCode", () => {
  it("lê subcampo 05 dentro da tag 62", () => {
    const fragment = "62070503abc63041234";
    expect(extractPixTxIdFromBrCode(fragment)).toBe("abc");
  });

  it("retorna null quando não há tag 62", () => {
    expect(extractPixTxIdFromBrCode("520400005303986")).toBeNull();
  });

  it("deduplica em extractPixTxIdsFromBrCodes", () => {
    const p = "62080504same63041234";
    expect(extractPixTxIdsFromBrCodes(p, p)).toEqual(["same"]);
  });
});
