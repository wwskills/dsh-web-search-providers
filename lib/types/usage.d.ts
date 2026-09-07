/**
 * Monthly usage tracking per provider. Counts are persisted as JSON inside the
 * plugin's data directory and surfaced through the usage Web API.
 * @module @wwskills/dsh-web-search-providers/usage
 */
/** Free-tier monthly call quotas, used to make the usage gauge meaningful. */
export declare const FREE_QUOTAS: Record<string, number>;
/** A single provider's count for the current month, against its quota. */
export interface UsageEntry {
    provider: string;
    month: string;
    used: number;
    quota: number | null;
}
/** Shape returned by {@link getUsageSnapshot}. */
export interface UsageSnapshot {
    month: string;
    providers: Record<string, {
        used: number;
        quota: number | null;
    }>;
}
/**
 * Increment the call count for a provider in the current month, returning the
 * updated entry for that provider.
 */
export declare function incrementUsage(provider: string): UsageEntry;
/** Snapshot of the current month's usage across all known providers. */
export declare function getUsageSnapshot(): UsageSnapshot;
//# sourceMappingURL=usage.d.ts.map