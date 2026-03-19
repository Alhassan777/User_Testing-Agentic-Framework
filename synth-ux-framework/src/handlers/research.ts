/**
 * Handlers for research-related tools: GitHub analysis and web search for competitors
 */

import {
  generateAppBriefFromGitHub,
  fetchGitHubRepoInfo,
  isGitHubUrl,
  searchCompetitors,
  formatSearchResultsForLLM,
} from '../ai-executor/index.js';

export async function handleAnalyzeGitHubRepo(args: Record<string, unknown>): Promise<string> {
  const repoUrl = args.repo_url as string;

  if (!isGitHubUrl(repoUrl)) {
    return JSON.stringify({
      success: false,
      error: 'Invalid GitHub URL. Please provide a URL like https://github.com/owner/repo',
    }, null, 2);
  }

  try {
    // Fetch raw repo info (includes deep crawl of source files)
    const repoInfo = await fetchGitHubRepoInfo(repoUrl);
    if (!repoInfo) {
      return JSON.stringify({
        success: false,
        error: 'Failed to fetch repository information. Check if the URL is correct and the repo is public.',
        hint: 'Set GITHUB_TOKEN environment variable for private repos or higher rate limits.',
      }, null, 2);
    }

    // Generate AI-powered app brief (uses deep crawl context)
    const appBrief = await generateAppBriefFromGitHub(repoUrl);

    const tier1Files = repoInfo.tieredFiles.filter(f => f.tier === 1);
    const tier2Files = repoInfo.tieredFiles.filter(f => f.tier === 2);
    const tier3Files = repoInfo.tieredFiles.filter(f => f.tier === 3);

    return JSON.stringify({
      success: true,
      crawl_summary: {
        dirs_in_tree: repoInfo.directoryTree.filter(n => n.type === 'dir').length,
        files_in_tree: repoInfo.directoryTree.filter(n => n.type === 'file').length,
        tier1_files_read: tier1Files.length,
        tier2_files_read: tier2Files.length,
        tier3_files_read: tier3Files.length,
        total_files_read: repoInfo.tieredFiles.length,
      },
      repository: {
        owner: repoInfo.owner,
        name: repoInfo.repo,
        description: repoInfo.description,
        homepage: repoInfo.homepage,
        stars: repoInfo.stars,
        forks: repoInfo.forks,
        license: repoInfo.license,
        topics: repoInfo.topics,
        languages: repoInfo.languages,
        open_issues: repoInfo.openIssuesCount,
      },
      discovered: {
        api_routes: repoInfo.apiRoutes,
        ui_components: repoInfo.uiComponents,
        database_schemas: repoInfo.databaseSchemas,
        env_vars_required: repoInfo.envVarKeys,
        files_by_tier: {
          tier1: tier1Files.map(f => ({ path: f.path, category: f.category })),
          tier2: tier2Files.map(f => ({ path: f.path, category: f.category })),
          tier3: tier3Files.map(f => ({ path: f.path, category: f.category })),
        },
      },
      app_brief: appBrief,
      readme_preview: repoInfo.readme?.substring(0, 800) + (repoInfo.readme && repoInfo.readme.length > 800 ? '\n\n[Truncated...]' : ''),
      usage_hint: 'Pass app_brief.summary as app_description when calling run_full_ux_study for richer UX analysis.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: (error as Error).message,
    }, null, 2);
  }
}

export async function handleSearchCompetitors(args: Record<string, unknown>): Promise<string> {
  const appName = args.app_name as string;
  const appDescription = args.app_description as string;

  try {
    const searchResults = await searchCompetitors(appName, appDescription);
    const hasWebResults = searchResults.some(sr => sr.source === 'tavily' && sr.results.length > 0);

    return JSON.stringify({
      success: true,
      search_method: hasWebResults ? 'web_search (Tavily)' : 'ai_inference',
      note: hasWebResults
        ? 'Results from live web search via Tavily'
        : 'No TAVILY_API_KEY configured. Set TAVILY_API_KEY for live web search. Free tier at https://app.tavily.com',
      queries_executed: searchResults.map(sr => ({
        query: sr.query,
        result_count: sr.results.length,
        source: sr.source,
      })),
      results: searchResults.flatMap(sr => sr.results),
      formatted_for_llm: formatSearchResultsForLLM(searchResults),
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: (error as Error).message,
    }, null, 2);
  }
}
