/**
 * Web search utilities for enhanced competitor discovery and market research.
 * Uses Tavily (free tier: 1,000 searches/month) or falls back to AI-only
 * analysis if no API key is configured.
 *
 * Get a free API key at: https://app.tavily.com
 * Set env var: TAVILY_API_KEY=tvly-...
 */
export interface WebSearchResult {
    title: string;
    link: string;
    snippet: string;
    position: number;
}
export interface SearchResults {
    query: string;
    results: WebSearchResult[];
    source: 'tavily' | 'ai_inference';
}
/**
 * Search the web using Tavily (if configured) or return empty for AI fallback.
 * Tavily free tier: 1,000 API calls/month — https://app.tavily.com
 */
export declare function webSearch(query: string, numResults?: number): Promise<SearchResults>;
/**
 * Search for competitors of a given product
 */
export declare function searchCompetitors(appName: string, appDescription: string): Promise<SearchResults[]>;
/**
 * Format search results for LLM context
 */
export declare function formatSearchResultsForLLM(searchResults: SearchResults[]): string;
