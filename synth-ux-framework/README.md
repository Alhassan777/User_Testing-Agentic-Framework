# Synth-UX MCP Server

**Synthetic UX Testing as an MCP Server for Cursor.** Install once, get comprehensive UX testing tools in any project.

## What This Does

An MCP (Model Context Protocol) server that provides AI-powered UX testing tools. When installed in Cursor, the AI gets access to:

- **16 specialized agents** with comprehensive protocols (see `/agents`)
- Evaluation against **Nielsen's 10 Heuristics + WCAG**
- **16-dimension persona generation** with diversity rules
- **Full UX study pipeline** (Phase 0–5): pre-testing → intelligence → derivation → execution → analysis → clips & outputs
- Session simulation with **think-aloud narration**, **time metrics** (TTFMA, hesitation, backtrack), and **PMF signals** (Sean Ellis, aha moments)
- **Vision-based screenshot annotations** — findings overlaid on screenshots via LLM (HTML + Figma-ready JSON)
- **Competitor discovery** with optional **web search** (Tavily) and **GitHub repo analysis** (tiered crawl)
- **RICE-prioritized** actionable reports and **Figma handoff** artifacts

## Quick Start

```bash
# 1. Clone and install
cd synth-ux-framework
npm install
npm run build

# 2. Set API keys (see Environment Variables below)
# 3. Add to Cursor MCP config (see Manual Installation)
# 4. Restart Cursor

# 5. In Cursor chat, run a full study:
"Run run_full_ux_study on https://your-app.com with app_name MyApp and app_description A task management app"
```

## Manual Installation

### Step 1: Build the Server

```bash
npm install
npm run build
```

### Step 2: Environment Variables

Create a `.env` file in the **synth-ux-framework root** (same folder as `package.json`), or set variables in Cursor's MCP config `env` (see Step 3).

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` | Yes (for AI tools) | LLM for personas, sessions, reports. **Gemini** preferred (free tier). |
| `TAVILY_API_KEY` | No | [Tavily](https://app.tavily.com) — live web search for **competitor discovery**. Free tier: 1,000 searches/month. Without it, competitors use AI inference only. |
| `GITHUB_TOKEN` | No | GitHub API — for **private repos** and higher rate limits when using `analyze_github_repo`. |

- **Gemini**: [Google AI Studio](https://aistudio.google.com/apikey)  
- **Anthropic**: [Anthropic Console](https://console.anthropic.com)  
If both are set, **Gemini is used first**.

To load `.env` from file, add at the top of `src/index.ts`: `import 'dotenv/config';` and run `npm install dotenv`.

### Step 3: Add to Cursor MCP Config

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "user-synth-ux": {
      "command": "node",
      "args": ["/full/path/to/synth-ux-framework/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-key",
        "TAVILY_API_KEY": "tvly-xxx",
        "GITHUB_TOKEN": "optional"
      }
    }
  }
}
```

Use the absolute path to `dist/index.js`. Restart Cursor after changes.

### Step 4: Restart Cursor

Restart Cursor to load the MCP server.

## Available Tools

### Full UX Study (Recommended)

| Tool | Time | Description |
|------|------|-------------|
| `run_full_ux_study` | ~5–15 min | **End-to-end study**: Phase 0 (heuristics, first-click) → Phase 1 (app brief, JTBD, competitors, personas) → Phase 2 (task list) → Phase 3 (sessions, time metrics, interviews, design audit) → Phase 4 (dual coding, segments, analysis, calibration, A/B hypotheses) → Phase 5 (clips, library, weekly digest) → reports + **annotated screenshots** + Figma handoff. Requires `url`, `app_name`, `app_description`; optional `credentials`, `persona_count`, `pages_to_test`. |

### Research & Discovery

| Tool | Description |
|------|-------------|
| `search_competitors` | Web search for competitors (uses **Tavily** if `TAVILY_API_KEY` is set; otherwise AI inference). Input: `app_name`, `app_description`. |
| `analyze_github_repo` | Analyze a GitHub repo to generate an **app brief**: tiered read of README, `/docs`, `package.json`/`requirements.txt`, Dockerfile, `.env.example` (Tier 1); entry points and routes (Tier 2); services/models sample (Tier 3). Output: summary, tech stack, features, target users, setup complexity, API surface, auth strategy, env vars. Optional `GITHUB_TOKEN`. |

### Agent Tools (Protocol / Granular)

| Tool | Time | Description |
|------|------|-------------|
| `synth_ux_full_test` | ~15 min | Full UX test protocol (heuristics → personas → sessions → report); returns instructions for browser MCP. |
| `heuristic_evaluate` | ~5 min | Nielsen's 10 + WCAG evaluation |
| `persona_generate` | ~2 min | Generate diverse synthetic personas (16 dimensions, diversity rules) |
| `session_simulate` | ~5 min | Simulate a user session as a persona (think-aloud, friction, aha) |
| `jtbd_analyze` | ~3 min | Jobs-to-Be-Done analysis |
| `problem_severity_classify` | ~2 min | Classify personas by problem severity |
| `reflection_interview` | ~3 min | 12-question post-session interview (incl. Sean Ellis) |
| `report_generate` | ~3 min | RICE-prioritized report |
| `segment_heat_map` | ~3 min | PMF segments / heat map |
| `voice_of_user_digest` | ~2 min | Weekly digest |
| `list_agents` | instant | List all available agents |

### Video Recording (Playwright)

| Tool | Description |
|------|-------------|
| `video_start_recording` | Start recording a browser session (returns session_id) |
| `video_stop_recording` | Stop recording and save video |
| `video_list_recordings` | List recorded videos |

### Accessibility & Performance

| Tool | Description |
|------|-------------|
| `accessibility_scan` | axe-core WCAG scan (violations + recommendations) |
| `lighthouse_audit` | Lighthouse audit (Core Web Vitals, scores) |

## Study Output (run_full_ux_study)

Each run writes to `output/studies/study_<id>/`:

| Category | Artifacts |
|----------|-----------|
| **Phase 0** | `heuristic_evaluation.json`, `first_click_analysis.json` |
| **Phase 1** | `app_brief.json`, `jtbd.json`, `competitors.json`, `personas.json` |
| **Phase 2** | `task_list.json` |
| **Phase 3** | `session_*.json`, `time_metrics_*.json`, `interview_*.json`, `design_audit.json` |
| **Phase 4** | `problem_severity.json`, `dual_coding.json`, `segment_heat_map.json`, `analysis.json`, `calibration.json`, `ab_hypotheses.json` |
| **Phase 5** | `clips.json`, `clip_library.json`, `weekly_digest.json` |
| **Output** | `highlights.json`, `figma_annotations.json`, `figma_handoff_highlights.json`, `COMPETITOR_COMPARISON.md`, `INSIGHTS_REPORT.md`, `full_results.json` |
| **Media** | `screenshots/*.png`, `videos/*.webm`, `annotated_screenshots/*.html` |

**Annotated screenshots**: Vision LLM places bounding boxes on screenshots from findings; the framework generates **HTML overlays** (open in browser) and **figma_annotations.json** for design handoff. The Figma MCP (`figma-developer-mcp`) is read-only for design inspection; annotations are produced by the framework, not by pushing into Figma.

## Usage Examples

### Full study with login

```
Run run_full_ux_study on https://myapp.com with app_name MyApp, app_description "A task management app for teams", and credentials email=test@example.com password=secret
```

### Competitor search only

```
Use search_competitors with app_name MyApp and app_description "Task management for remote teams"
```

### App brief from GitHub

```
Use analyze_github_repo with repo_url https://github.com/owner/repo
```

### Quick heuristic audit

```
Use heuristic_evaluate on https://myapp.com/signup
```

### Generate personas only

```
Use persona_generate for "a task management app for remote teams", 5 personas
```

### Video recording

```
Use video_start_recording on https://myapp.com with session_name "signup_flow"
# ... do browser interactions ...
Use video_stop_recording with session_id "session_12345"
```

## Architecture

### Modular layout (refactored)

```
src/
├── index.ts              # Entry point → starts MCP server
├── server.ts             # MCP server setup
├── tools/
│   └── definitions.ts    # All tool schemas
├── handlers/
│   ├── index.ts         # Router → full-study, agents, video, accessibility, lighthouse, autonomous, research
│   ├── full-study.ts    # run_full_ux_study (6-phase pipeline)
│   ├── agents.ts        # Protocol-based tools (synth_ux_full_test, list_agents, etc.)
│   ├── video.ts         # Video recording
│   ├── accessibility.ts # axe-core scan
│   ├── lighthouse.ts    # Lighthouse audit
│   ├── autonomous.ts    # run_autonomous_ux_test
│   └── research.ts      # search_competitors, analyze_github_repo
├── utils/                # paths, agents, sessions
├── ai-executor/          # types, llm (incl. vision callLLMWithImage), json (robust parsing), tasks
├── figma/                # Vision-based annotations → HTML + figma_annotations.json
└── orchestrator/         # State machine, resource manager, artifact pipeline (optional)
```

### Flow (run_full_ux_study)

1. **Phase 0** — Launch browser, capture landing page, heuristic evaluation, first-click analysis, screenshots.
2. **Phase 1** — Lighthouse + accessibility, app brief (from page + links + screenshots), JTBD, **competitor discovery** (AI + optional Tavily web search), **personas** (16 dimensions, diversity rules).
3. **Phase 2** — Task list derived from app brief + personas + JTBD.
4. **Phase 3** — Per-persona: simulated session, time metrics, highlights, post-session interview; design audit.
5. **Phase 4** — Problem severity, dual coding, segment heat map, analysis, calibration, A/B hypotheses (with robust JSON parsing for LLM outputs).
6. **Phase 5** — Clip extraction, clip library, weekly voice-of-user digest.
7. **Output** — Competitor comparison, highlights, **vision-based annotated screenshots** (HTML + Figma JSON), insights report.

## The 16 Agents

Defined in `/agents`; used for protocol tools and (where wired) inside the full study:

| Agent | Purpose |
|-------|---------|
| `orchestrator` | Central coordinator with state machine |
| `heuristic_evaluator` | Nielsen's 10 + WCAG |
| `first_click_analyzer` | Information scent |
| `jtbd_mapper` | Jobs-to-Be-Done (functional, emotional, social) |
| `problem_severity` | Hair on Fire → Latent |
| `persona_generator` | 16-dimension personas + diversity rules |
| `browser_user` | Session simulation, think-aloud, metrics |
| `aha_detector` | Value realization moments |
| `reflection` | 12-question interview (incl. Sean Ellis) |
| `dual_coder` | Cohen's Kappa, thematic coding |
| `segment_heat_mapper` | PMF probability by segment |
| `calibration` | Confidence + validity disclaimers |
| `ab_hypothesis_generator` | A/B test hypotheses |
| `clip_curator` | Clip extraction + summaries |
| `voice_of_user` | Weekly digest |
| `report` | RICE-prioritized report |

## Personas & Competitors

- **Personas**: Generated from the **app brief** (Phase 1). **16 dimensions** (e.g. role, technical literacy, industry, urgency, budget, competing apps, adoption stage, frustration threshold, primary goal, device context, plus extended dimensions). **Diversity rules**: e.g. ≥3 technical literacy levels, no duplicate roles, mix of patience levels, max 50% overlap in competing apps.
- **App brief**: From URL + landing page text + nav links + screenshot labels (purpose, audience, features, positioning).
- **Competitors**: From app name + description + page content; **optionally augmented with Tavily web search** (queries like “[app] alternatives”, “[app] competitors”, “best [category] tools”, “[app] vs”) when `TAVILY_API_KEY` is set.

## GitHub Repo Analysis (Tiered Crawl)

`analyze_github_repo` uses the **GitHub REST API v3** (native `fetch`; no extra npm package). Optional `GITHUB_TOKEN` for private repos and higher rate limits.

- **Tier 1 (must-read)**: README, `/docs`, `package.json` / `requirements.txt`, Dockerfile, `.env.example`.
- **Tier 2 (architecture)**: Entry points (`main.py`, `app.py`, `index.js`, etc.), configs (`next.config.js`, `vite.config.ts`), routes (`routes/`, `api/`, `controllers/`).
- **Tier 3 (core logic)**: Representative files from `services/`, `models/`, `lib/`, etc.

Output includes summary, tech stack, features, target users, API surface, auth strategy, env vars, competitor hints.

## Annotations & Figma

- **Screenshot annotations** are produced by the **framework**: a **vision-capable LLM** (Gemini/Claude) gets the screenshot + finding text and returns bounding boxes; the framework draws **HTML overlays** (`annotated_screenshots/*.html`) and writes **figma_annotations.json** (rects, severity, labels) for handoff.
- **Figma MCP** (`figma-developer-mcp`): read-only (design inspection). For Cursor, use stdio mode: `npx -y figma-developer-mcp --stdio` and `FIGMA_API_KEY` in env. The framework does **not** push annotations into Figma; it prepares data so you or a future integration can.

## Limitations

Synthetic UX testing is **great** for:

- Finding navigation confusion, form friction, accessibility issues
- Comparing task flows and competitor positioning
- Generating hypotheses and prioritized issue lists

It **cannot** reliably replace:

- Emotional brand response, trust, long-term retention, real market demand
- Final validation (treat outputs as “synthetic suggests X — validate with real users”).

## Requirements

- Node.js 18+
- Cursor with MCP support
- Chrome/Chromium (for Playwright / Lighthouse)

### Included (npm install)

- **Playwright** — browser automation, video recording
- **axe-core** — WCAG accessibility
- **Lighthouse** — performance audits

### Post-install

```bash
npx playwright install chromium
```

## Customization

- Edit markdown files in **`/agents`** to change heuristic criteria, persona dimensions, report format, interview questions.
- Execution prompts and task logic live in **`src/ai-executor/tasks.ts`** (and related modules).

## License

MIT
