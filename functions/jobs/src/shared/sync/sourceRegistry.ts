import { CredlySyncSource } from "../providers/credly";
import { ICertSyncSource } from "../providers/syncSource";

// Sync sources keyed by `source`. Credly covers AWS/CompTIA/HashiCorp today;
// a Microsoft source can be registered here later behind the same interface.
const sources = new Map<string, ICertSyncSource>();
sources.set("credly", new CredlySyncSource());

export function getSyncSource(source: string): ICertSyncSource | undefined {
  return sources.get(source);
}
