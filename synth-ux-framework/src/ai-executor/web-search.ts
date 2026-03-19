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

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

interface TavilyResponse {
  query: string;
  results: TavilyResult[];
}

/**
 * Search the web using Tavily (if configured) or return empty for AI fallback.
 * Tavily free tier: 1,000 API calls/month — https://app.tavily.com
 */
export async function webSearch(query: string, numResults: number = 10): Promise<SearchResults> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;

  if (tavilyApiKey) {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query,
          max_results: numResults,
          search_depth: 'basic',
          include_answer: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily error: ${response.status} ${await response.text()}`);
      }

      const data = await response.json() as TavilyResponse;
      const items = data.results || [];

      return {
        query,
        source: 'tavily',
        results: items.slice(0, numResults).map((r, i) => ({
          title: r.title || '',
          link: r.url || '',
          snippet: r.content || '',
          position: i + 1,
        })),
      };
    } catch (error) {
      console.error('Tavily search failed, falling back to AI inference:', error);
    }
  }

  // No API key or request failed — return empty results for AI fallback
  return {
    query,
    source: 'ai_inference',
    results: [],
  };
}

/**
 * Search for competitors of a given product
 */
export async function searchCompetitors(
  appName: string,
  appDescription: string
): Promise<SearchResults[]> {
  const queries = [
    `${appName} alternatives`,
    `${appName} competitors`,
    `best ${extractProductCategory(appDescription)} tools 2024`,
    `${appName} vs`,
  ];

  const results: SearchResults[] = [];

  for (const query of queries) {
    const searchResult = await webSearch(query, 5);
    results.push(searchResult);

    // Add small delay between requests to be respectful of rate limits
    if (searchResult.source === 'tavily') {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  return results;
}

/**
 * Extract product category from description for better search queries
 */
function extractProductCategory(description: string): string {
  const categories = [
    'project management',
    'crm',
    'note taking',
    'collaboration',
    'productivity',
    'design',
    'developer tools',
    'marketing',
    'analytics',
    'automation',
    'communication',
    'documentation',
    'database',
    'scheduling',
    'invoicing',
    'email',
  ];

  const lowerDesc = description.toLowerCase();
  for (const cat of categories) {
    if (lowerDesc.includes(cat)) {
      return cat;
    }
  }

  // Default fallback
  return 'software';
}

/**
 * Format search results for LLM context
 */
export function formatSearchResultsForLLM(searchResults: SearchResults[]): string {
  if (searchResults.every(sr => sr.results.length === 0)) {
    return 'No web search results available. Use your training knowledge to identify competitors.';
  }

  let formatted = '## Web Search Results for Competitor Research\n\n';

  for (const sr of searchResults) {
    if (sr.results.length > 0) {
      formatted += `### Query: "${sr.query}"\n`;
      for (const r of sr.results) {
        formatted += `- **${r.title}** (${r.link})\n  ${r.snippet}\n`;
      }
      formatted += '\n';
    }
  }

  return formatted;
}
