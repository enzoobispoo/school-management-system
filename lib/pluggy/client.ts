import "server-only";

import { PluggyClient } from "pluggy-sdk";
import { getPluggyClientCredentials } from "@/lib/pluggy/env";

let singleton: PluggyClient | null = null;

export function getPluggyServerClient(): PluggyClient {
  if (!singleton) {
    const { clientId, clientSecret } = getPluggyClientCredentials();
    singleton = new PluggyClient({ clientId, clientSecret });
  }
  return singleton;
}
