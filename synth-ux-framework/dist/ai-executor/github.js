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
import { callLLM } from './llm.js';
import { parseJsonObject } from './json.js';
// ─────────────────────────────────────────────
// Tier definitions
// ─────────────────────────────────────────────
/**
 * Tier 1: exact filenames to always attempt, regardless of tree contents.
 * These answer "what does this do, how do I run it, what does it need?"
 */
const TIER1_EXACT = [
    { path: 'README.md', category: 'readme' },
    { path: 'readme.md', category: 'readme' },
    { path: 'README.mdx', category: 'readme' },
    { path: 'package.json', category: 'manifest' },
    { path: 'requirements.txt', category: 'manifest' },
    { path: 'pyproject.toml', category: 'manifest' },
    { path: 'go.mod', category: 'manifest' },
    { path: 'Cargo.toml', category: 'manifest' },
    { path: 'Gemfile', category: 'manifest' },
    { path: 'Dockerfile', category: 'deployment' },
    { path: 'docker-compose.yml', category: 'deployment' },
    { path: 'docker-compose.yaml', category: 'deployment' },
    { path: '.env.example', category: 'env' },
    { path: '.env.sample', category: 'env' },
    { path: '.env.template', category: 'env' },
    { path: '.env.local.example', category: 'env' },
];
/**
 * Tier 2: patterns for entry points, framework configs, and routes.
 * These answer "what is the architecture, how is it structured?"
 */
const TIER2_ENTRY_POINTS = [
    'main.py', 'app.py', 'server.py', 'run.py', 'wsgi.py', 'asgi.py',
    'index.js', 'index.ts', 'server.js', 'server.ts', 'app.js', 'app.ts',
    'main.go', 'main.rs', 'Program.cs', 'Application.java',
    'src/index.js', 'src/index.ts', 'src/main.ts', 'src/app.ts',
    'src/main.py', 'src/app.py',
];
const TIER2_FRAMEWORK_CONFIGS = [
    'next.config.js', 'next.config.ts', 'next.config.mjs',
    'vite.config.ts', 'vite.config.js',
    'nuxt.config.ts', 'nuxt.config.js',
    'astro.config.mjs',
    'remix.config.js',
    'svelte.config.js',
    'angular.json',
    'vercel.json', 'netlify.toml', 'fly.toml', 'render.yaml',
    'supabase/config.toml',
    'firebase.json',
];
/** Tier 2 route directories — list dir and pick up to 3 files */
const TIER2_ROUTE_DIRS = [
    'routes', 'api', 'controllers', 'pages', 'app',
    'src/routes', 'src/api', 'src/controllers', 'src/pages', 'src/app',
];
/** Tier 2 docs directories — list dir and pick first 2 markdown files */
const TIER2_DOC_DIRS = ['docs', 'documentation', 'doc'];
/**
 * Tier 3: service/model directories — list dir and pick 1-2 representative files.
 * These answer "what does the core logic do?"
 */
const TIER3_DIRS = [
    { dir: 'services', category: 'service', limit: 2 },
    { dir: 'src/services', category: 'service', limit: 2 },
    { dir: 'lib', category: 'lib', limit: 2 },
    { dir: 'src/lib', category: 'lib', limit: 2 },
    { dir: 'models', category: 'model', limit: 2 },
    { dir: 'src/models', category: 'model', limit: 2 },
    { dir: 'db', category: 'db', limit: 2 },
    { dir: 'prisma', category: 'schema', limit: 1 },
    { dir: 'database', category: 'db', limit: 2 },
    { dir: 'store', category: 'store', limit: 2 },
    { dir: 'src/store', category: 'store', limit: 2 },
];
/** Tier 3 single schema files to attempt */
const TIER3_SCHEMA_FILES = [
    'schema.prisma', 'prisma/schema.prisma',
    'drizzle.config.ts', 'db/schema.ts',
];
// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
export function parseGitHubUrl(url) {
    const patterns = [
        /github\.com\/([^\/]+)\/([^\/\?#]+)/,
        /^([^\/]+)\/([^\/]+)$/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m)
            return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
    }
    return null;
}
export function isGitHubUrl(url) {
    return url.includes('github.com/') && parseGitHubUrl(url) !== null;
}
function buildHeaders() {
    const h = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'synth-ux-mcp',
    };
    if (process.env.GITHUB_TOKEN)
        h['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    return h;
}
function decodeBase64(content) {
    return Buffer.from(content, 'base64').toString('utf-8');
}
async function safeGet(url, headers) {
    try {
        const res = await fetch(url, { headers });
        if (!res.ok)
            return null;
        return await res.json();
    }
    catch {
        return null;
    }
}
async function fetchFile(owner, repo, path, headers, maxChars = 5000) {
    const data = await safeGet(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, headers);
    if (!data || data.type !== 'file' || !data.content)
        return null;
    const text = decodeBase64(data.content);
    return text.length > maxChars ? text.substring(0, maxChars) + '\n...[truncated]' : text;
}
async function listDir(owner, repo, dirPath, headers) {
    const items = await safeGet(`https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`, headers);
    return Array.isArray(items) ? items : [];
}
function extractEnvKeys(content) {
    return content
        .split('\n')
        .filter(line => /^[A-Z_][A-Z0-9_]+=/.test(line.trim()))
        .map(line => line.split('=')[0].trim());
}
function extractProcessEnvRefs(content) {
    const refs = content.match(/process\.env\.([A-Z_][A-Z0-9_]*)/g) || [];
    return refs.map(r => r.replace('process.env.', ''));
}
const IGNORED_DIRS = new Set([
    'node_modules', '.git', '.next', 'dist', 'build', 'out', 'coverage',
    '.cache', '__pycache__', '.pytest_cache', 'vendor', 'venv', '.venv',
    'target', '.gradle', '.idea', '.vscode', '.turbo', 'storybook-static',
]);
async function shallowTree(owner, repo, headers) {
    // Only fetch root + one level deep for the tree summary
    const root = await listDir(owner, repo, '', headers);
    const nodes = [];
    for (const item of root) {
        if (item.type === 'dir') {
            if (IGNORED_DIRS.has(item.name))
                continue;
            nodes.push({ path: item.path, type: 'dir' });
            const children = await listDir(owner, repo, item.path, headers);
            for (const child of children) {
                if (child.type === 'dir' && !IGNORED_DIRS.has(child.name)) {
                    nodes.push({ path: child.path, type: 'dir' });
                }
                else if (child.type === 'file') {
                    nodes.push({ path: child.path, type: 'file', size: child.size });
                }
            }
        }
        else if (item.type === 'file') {
            nodes.push({ path: item.path, type: 'file', size: item.size });
        }
    }
    return nodes;
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
// ─────────────────────────────────────────────
// Main public API
// ─────────────────────────────────────────────
/**
 * Fetch GitHub repo info using tiered reading strategy.
 * Total API calls: ~15-25 (well within anonymous limit of 60/hr).
 */
export async function fetchGitHubRepoInfo(repoUrl) {
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed)
        return null;
    const { owner, repo } = parsed;
    const h = buildHeaders();
    const tieredFiles = [];
    const envVarKeys = [];
    const apiRoutes = [];
    const uiComponents = [];
    const databaseSchemas = [];
    try {
        // ─── Repo metadata ───────────────────────────────────────────────
        const repoData = await safeGet(`https://api.github.com/repos/${owner}/${repo}`, h);
        if (!repoData)
            throw new Error('Repository not found or not accessible');
        const languages = await safeGet(`https://api.github.com/repos/${owner}/${repo}/languages`, h) ?? {};
        // Shallow tree for directory overview (2 levels, ~10 API calls)
        const directoryTree = await shallowTree(owner, repo, h);
        // ─── TIER 1: Must-reads ──────────────────────────────────────────
        // Try each exact path, collect what exists
        let readme = null;
        let packageJson = null;
        for (const { path, category } of TIER1_EXACT) {
            const content = await fetchFile(owner, repo, path, h, 8000);
            if (!content)
                continue;
            tieredFiles.push({ tier: 1, category, path, content });
            if (category === 'readme') {
                readme = content;
            }
            else if (category === 'manifest' && path === 'package.json') {
                try {
                    packageJson = JSON.parse(content);
                }
                catch { /* ignore */ }
            }
            else if (category === 'env') {
                envVarKeys.push(...extractEnvKeys(content));
                // Once we found one env file, stop trying others
                break;
            }
            await delay(80);
        }
        // ─── TIER 2: Architecture signals ────────────────────────────────
        // Entry points
        for (const path of TIER2_ENTRY_POINTS) {
            const content = await fetchFile(owner, repo, path, h, 4000);
            if (!content)
                continue;
            tieredFiles.push({ tier: 2, category: 'entry_point', path, content });
            envVarKeys.push(...extractProcessEnvRefs(content));
            await delay(80);
            break; // first found entry point is enough
        }
        // Framework configs
        for (const path of TIER2_FRAMEWORK_CONFIGS) {
            const content = await fetchFile(owner, repo, path, h, 3000);
            if (!content)
                continue;
            tieredFiles.push({ tier: 2, category: 'framework_config', path, content });
            await delay(80);
        }
        // Routes — list each route dir and pick up to 3 source files
        const seenRoutePaths = new Set();
        for (const dir of TIER2_ROUTE_DIRS) {
            const items = await listDir(owner, repo, dir, h);
            if (!items.length)
                continue;
            const routeFiles = items
                .filter(f => f.type === 'file' && /\.(ts|tsx|js|jsx|py|rb|go)$/.test(f.name))
                .slice(0, 3);
            for (const rf of routeFiles) {
                if (seenRoutePaths.has(rf.path))
                    continue;
                seenRoutePaths.add(rf.path);
                const content = await fetchFile(owner, repo, rf.path, h, 3000);
                if (!content)
                    continue;
                tieredFiles.push({ tier: 2, category: 'route', path: rf.path, content });
                apiRoutes.push(rf.path);
                envVarKeys.push(...extractProcessEnvRefs(content));
                await delay(80);
            }
            if (apiRoutes.length >= 6)
                break; // enough route samples
        }
        // Docs — list docs/ and pick up to 2 markdown files
        for (const docDir of TIER2_DOC_DIRS) {
            const items = await listDir(owner, repo, docDir, h);
            if (!items.length)
                continue;
            const mdFiles = items
                .filter(f => f.type === 'file' && /\.(md|mdx)$/.test(f.name))
                .slice(0, 2);
            for (const mdf of mdFiles) {
                const content = await fetchFile(owner, repo, mdf.path, h, 3000);
                if (content)
                    tieredFiles.push({ tier: 2, category: 'docs', path: mdf.path, content });
                await delay(80);
            }
            break;
        }
        // ─── TIER 3: Core logic (representative sample only) ─────────────
        // Schema files (exact paths)
        for (const path of TIER3_SCHEMA_FILES) {
            const content = await fetchFile(owner, repo, path, h, 5000);
            if (!content)
                continue;
            tieredFiles.push({ tier: 3, category: 'schema', path, content });
            databaseSchemas.push(path);
            await delay(80);
            break;
        }
        // Service / model / lib directories — 1-2 files each
        for (const { dir, category, limit } of TIER3_DIRS) {
            const items = await listDir(owner, repo, dir, h);
            if (!items.length)
                continue;
            const srcFiles = items
                .filter(f => f.type === 'file' && /\.(ts|js|py|rb|go)$/.test(f.name))
                .slice(0, limit);
            for (const sf of srcFiles) {
                const content = await fetchFile(owner, repo, sf.path, h, 3000);
                if (!content)
                    continue;
                tieredFiles.push({ tier: 3, category, path: sf.path, content });
                if (category === 'model' || category === 'db' || category === 'schema') {
                    databaseSchemas.push(sf.path);
                }
                const compName = sf.name.replace(/\.(tsx?|jsx?)$/, '');
                if (category === 'service')
                    uiComponents.push(compName);
                envVarKeys.push(...extractProcessEnvRefs(content));
                await delay(80);
            }
        }
        return {
            owner,
            repo,
            description: repoData.description,
            readme,
            packageJson,
            languages,
            topics: repoData.topics || [],
            stars: repoData.stargazers_count || 0,
            forks: repoData.forks_count || 0,
            license: repoData.license?.spdx_id || null,
            homepage: repoData.homepage || null,
            hasWiki: repoData.has_wiki || false,
            openIssuesCount: repoData.open_issues_count || 0,
            defaultBranch: repoData.default_branch || 'main',
            directoryTree,
            tieredFiles,
            apiRoutes: [...new Set(apiRoutes)],
            uiComponents: [...new Set(uiComponents)],
            databaseSchemas: [...new Set(databaseSchemas)],
            envVarKeys: [...new Set(envVarKeys)],
        };
    }
    catch (error) {
        console.error('Failed to fetch GitHub repo info:', error);
        return null;
    }
}
/**
 * Generate a code-informed app brief using tiered context.
 */
export async function generateAppBriefFromGitHub(repoUrl) {
    const info = await fetchGitHubRepoInfo(repoUrl);
    if (!info)
        return null;
    // Build context sections grouped by tier
    const tier1Section = info.tieredFiles
        .filter(f => f.tier === 1)
        .map(f => `### [T1] ${f.path} (${f.category})\n\`\`\`\n${f.content.substring(0, 2000)}\n\`\`\``)
        .join('\n\n');
    const tier2Section = info.tieredFiles
        .filter(f => f.tier === 2)
        .map(f => `### [T2] ${f.path} (${f.category})\n\`\`\`\n${f.content.substring(0, 1500)}\n\`\`\``)
        .join('\n\n');
    const tier3Section = info.tieredFiles
        .filter(f => f.tier === 3)
        .map(f => `### [T3] ${f.path} (${f.category})\n\`\`\`\n${f.content.substring(0, 1200)}\n\`\`\``)
        .join('\n\n');
    const treeSummary = info.directoryTree
        .filter(n => n.type === 'dir')
        .map(n => `- ${n.path}`)
        .slice(0, 40)
        .join('\n');
    const prompt = `You are a senior engineer and UX researcher. Analyze this GitHub repository to generate a comprehensive app brief for synthetic UX testing.

## Repository Metadata
- **Name:** ${info.owner}/${info.repo}
- **Description:** ${info.description || 'none'}
- **Homepage:** ${info.homepage || 'none'}
- **Stars:** ${info.stars} | **Forks:** ${info.forks}
- **Topics:** ${info.topics.join(', ') || 'none'}
- **Languages:** ${Object.entries(info.languages).map(([l, b]) => `${l} (${Math.round(b / 1024)}KB)`).join(', ')}
- **License:** ${info.license || 'none'}

## Directory Overview
${treeSummary || 'Not available'}

## Env Vars Required
${info.envVarKeys.length ? info.envVarKeys.slice(0, 30).map(k => `- ${k}`).join('\n') : 'None detected'}

## Routes Discovered
${info.apiRoutes.length ? info.apiRoutes.map(r => `- ${r}`).join('\n') : 'None detected'}

## Schema Files
${info.databaseSchemas.length ? info.databaseSchemas.map(s => `- ${s}`).join('\n') : 'None detected'}

---

## TIER 1 — Purpose, Stack, Dependencies, How to Run
${tier1Section || 'Not available'}

---

## TIER 2 — Entry Points, Configs, Routes
${tier2Section || 'Not available'}

---

## TIER 3 — Core Logic (Services, Models)
${tier3Section || 'Not available'}

---

Based on the evidence above, generate a precise app brief. Be specific — reference actual file names, route paths, schema models, and env var keys you observed.

Return ONLY valid JSON:
{
  "summary": "2-3 sentence summary of what this app does and who it serves",
  "techStack": ["specific technologies seen in code and configs"],
  "mainFeatures": ["5-8 features inferred from routes/components/schemas — be specific"],
  "targetUsers": ["user types inferred from feature set and naming"],
  "problemSolved": "One precise sentence describing the core problem solved",
  "setupComplexity": "simple|moderate|complex",
  "dependencies": ["key external services or APIs the app depends on"],
  "competitorHints": ["similar products users might compare this to"],
  "apiSurface": ["key API routes or pages discovered"],
  "uiComponents": ["significant UI components or pages found"],
  "dataModels": ["key data entities or models inferred from schema/code"],
  "authStrategy": "e.g. NextAuth + GitHub OAuth, Supabase Auth, JWT, None detected",
  "deploymentTarget": "e.g. Vercel (vercel.json), Docker (Dockerfile), Unknown",
  "envVarsRequired": ["env var keys the user must set to run the app"],
  "onboardingComplexity": "plain-English description of setup steps a new user needs"
}`;
    try {
        const text = await callLLM(prompt, 4000);
        return parseJsonObject(text, 'Failed to parse GitHub app brief');
    }
    catch (error) {
        console.error('Failed to generate app brief from GitHub:', error);
        return null;
    }
}
