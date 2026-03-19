/**
 * GitHub repository analysis using a tiered reading strategy.
 *
 * Tier 1 – MUST READ (purpose, stack, deps, how it runs)
 *   README.md, /docs/*, package.json / requirements.txt,
 *   Dockerfile, docker-compose.yml, .env.example
 *
 * Tier 2 – ARCHITECTURE SIGNALS (entry points, configs, routes)
 *   main.py / app.py / index.js / server.ts (entry points)
 *   next.config.js / vite.config.ts / nuxt.config.ts (framework configs)
 *   routes/ api/ controllers/ pages/ app/ (routing layer)
 *
 * Tier 3 – CORE LOGIC (services, models – representative sample only)
 *   services/ lib/ utils/ (1-2 files max)
 *   models/ db/ schema.prisma (1-2 files max)
 */
export interface DirectoryNode {
    path: string;
    type: 'file' | 'dir';
    size?: number;
}
export interface TieredFile {
    tier: 1 | 2 | 3;
    category: string;
    path: string;
    content: string;
}
export interface GitHubRepoInfo {
    owner: string;
    repo: string;
    description: string | null;
    readme: string | null;
    packageJson: Record<string, unknown> | null;
    languages: Record<string, number>;
    topics: string[];
    stars: number;
    forks: number;
    license: string | null;
    homepage: string | null;
    hasWiki: boolean;
    openIssuesCount: number;
    defaultBranch: string;
    directoryTree: DirectoryNode[];
    tieredFiles: TieredFile[];
    apiRoutes: string[];
    uiComponents: string[];
    databaseSchemas: string[];
    envVarKeys: string[];
}
export interface GitHubAppBrief {
    summary: string;
    techStack: string[];
    mainFeatures: string[];
    targetUsers: string[];
    problemSolved: string;
    setupComplexity: 'simple' | 'moderate' | 'complex';
    dependencies: string[];
    competitorHints: string[];
    apiSurface: string[];
    uiComponents: string[];
    dataModels: string[];
    authStrategy: string;
    deploymentTarget: string;
    envVarsRequired: string[];
    onboardingComplexity: string;
}
export declare function parseGitHubUrl(url: string): {
    owner: string;
    repo: string;
} | null;
export declare function isGitHubUrl(url: string): boolean;
/**
 * Fetch GitHub repo info using tiered reading strategy.
 * Total API calls: ~15-25 (well within anonymous limit of 60/hr).
 */
export declare function fetchGitHubRepoInfo(repoUrl: string): Promise<GitHubRepoInfo | null>;
/**
 * Generate a code-informed app brief using tiered context.
 */
export declare function generateAppBriefFromGitHub(repoUrl: string): Promise<GitHubAppBrief | null>;
