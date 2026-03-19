export * from './types.js';
export { getActiveLLMProvider } from './llm.js';
export {
  // Phase 0: Pre-Testing
  evaluateHeuristics,
  analyzeFirstClick,
  // Phase 1: Intelligence
  generateAppBrief,
  generatePersonas,
  analyzeJTBD,
  discoverCompetitors,
  // Phase 1b: Enhanced Intelligence (GitHub + Web Search)
  generateAppBriefFromRepo,
  fetchRepoContext,
  // Phase 2: Task Derivation
  deriveTaskList,
  classifyProblemSeverity,
  // Phase 3: Execution & Design
  simulateSession,
  generateDesignAudit,
  generateCompetitorComparison,
  // Phase 4: Analysis
  conductInterview,
  performDualCoding,
  generateSegmentHeatMap,
  generateAnalysis,
  generateCalibrationReport,
  generateABHypotheses,
  // Phase 5: Clips & Output
  extractClips,
  buildClipLibrary,
  generateWeeklyDigest,
  // Helpers
  analyzeTimeMetrics,
  generateInsights,
  generateFigmaAnnotations,
} from './tasks.js';

// Web search utilities
export { webSearch, searchCompetitors, formatSearchResultsForLLM } from './web-search.js';
export type { WebSearchResult, SearchResults } from './web-search.js';

// GitHub analysis utilities
export { fetchGitHubRepoInfo, generateAppBriefFromGitHub, isGitHubUrl, parseGitHubUrl } from './github.js';
export type { GitHubRepoInfo, GitHubAppBrief } from './github.js';
