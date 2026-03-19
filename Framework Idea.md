<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# I had an idea where I wanted to create a framework of agents and MCP servers interacting togehter to provide sysntehtic user feedback for your application.. I want the AI to be able to try the application in terms of user experience, navigate different tasks, and compare it with other competitive applications that the virtual user is supposedly trying or adopting. What solutions exists in the market that are open source frameworks which do similar functionality? and what does it lack?

Here’s a concise overview of what exists today and where the gaps are; the linked report has more detail.

## Direct answer

There are a few open-source projects that come close to what you describe—UXAgent, `llm-user-testing`, TinyTroupe, AgentLab/BrowserGym, and example synthetic-user research setups on top of multi-agent frameworks—but none provide a MCP-native, multi-agent “synthetic users + competitor comparison” framework out of the box. They either focus on single-site UX testing, generic persona simulation, or web-agent benchmarking, and they generally lack: first-class competitive journeys, MCP-style tool abstraction, rich UX/adoption metrics, and persistent synthetic cohorts integrated into CI/CD.[^1_1][^1_2][^1_3][^1_4][^1_5][^1_6][^1_7][^1_8][^1_9][^1_10][^1_11][^1_12]

## Key open-source building blocks

### UXAgent (LLM agents doing usability tests in a browser)

- Academic/OSS framework that uses LLM agents plus a “Universal Web Connector” (Playwright/Chromium) to run usability studies on arbitrary websites, generate qualitative and quantitative UX metrics, and even record videos.[^1_3][^1_4]
- Very aligned with “LLM-as-user tries the app via a browser,” but aimed at evaluating a single site at a time rather than comparing your app and competitors or modeling adoption over time.[^1_4][^1_3]


### `llm-user-testing` / `claude-workflow-agents`

- A domain-specific “LLM-as-User” testing skill that encodes protocols for persona definition, test design, and running scenario suites via CLI-like commands (`/llm-user init/test/fix/...`).[^1_1]
- Strong on UX testing workflows and persona-driven simulation, with hooks for CI/CD, but still conceptually focused on testing *one* UI or system per run and not on multi-app journeys or competitive evaluation.[^1_1]


### TinyTroupe (multi-agent persona simulation)

- Microsoft’s TinyTroupe simulates detailed personas (demographics, personality, beliefs, behaviors) interacting in a “TinyWorld,” and is used for market research, product feedback, and synthetic data generation.[^1_2][^1_13][^1_7]
- Excellent for realistic personas and social dynamics, but it doesn’t natively drive real UIs or browsers; connecting it to actual apps (your product + competitors) and measuring UX paths would require custom tooling and orchestration.[^1_13][^1_7][^1_2]


### AgentLab + BrowserGym (web agents and benchmarks)

- BrowserGym is a Gym-like environment for web tasks; AgentLab is an OSS framework on top that lets you build, run, and benchmark web agents at scale on environments like WebArena, with unified LLM APIs and leaderboards.[^1_8][^1_9][^1_14]
- Great for “agent can complete web tasks?” experiments and large-scale evaluation, but its metrics are task-centric (success, steps, errors), not UX-centric (frustration, learnability, perceived quality) and it doesn’t model personas, adoption, or competitor comparison.[^1_9][^1_8]


### Example synthetic-user research notebook (Autogen, BabyAGI, CrewAI)

- The `synthetic-user-research` repo shows how to create synthetic personas and run research-style interactions using multi-agent frameworks like Autogen, BabyAGI, and CrewAI.[^1_5]
- It’s more a pattern/demo than a full framework: no standardized UX schema, browser layer, or competitive-testing abstraction—you’d still need to design most of the system you’re imagining.[^1_5]


### General multi-agent frameworks

- Curated lists like `awesome-llm-agents` plus recent surveys show many open-source multi-agent frameworks (OpenManus, OpenAgents, etc.) with abstractions for agents, tools, workflows, and provider-agnostic LLM access.[^1_6][^1_15]
- They are good substrates for your idea, but they don’t ship UX-specific constructs (UX metrics, user journeys, competitor comparisons) or MCP-native tool interfaces as first-class concerns.[^1_15][^1_6]


## What’s missing relative to your idea

Relative to your “framework of agents + MCP servers that behave like synthetic users, try tasks, and compare your app to competitors,” today’s OSS options lack several things:

1. **First-class competitive journeys**
    - Existing UX/testing frameworks evaluate one app/design at a time; they don’t treat “same persona, same task, across multiple apps” as a core primitive or model longitudinal switching/adoption.[^1_10][^1_3][^1_8][^1_1]
2. **MCP-native tool abstraction for apps and services**
    - Most frameworks integrate browsers and APIs via bespoke SDKs or LangChain-style tools, not via MCP; there’s no open-source stack where each app (your product, competitors, internal systems) is an MCP server that multi-role agents can call uniformly.[^1_12][^1_4][^1_6][^1_8]
3. **Rich UX + adoption metrics baked into the framework**
    - Web-agent frameworks track task success, steps, and errors; persona simulators handle behavior/beliefs but don’t operate real UIs; neither camp provides built-in schemas for UX-specific metrics (confusion points, perceived effort, accessibility issues) or for adoption curves (how synthetic users update their preferences over sessions).[^1_7][^1_2][^1_8][^1_9][^1_10]
4. **Continuous synthetic cohorts integrated with CI/CD**
    - `llm-user-testing` moves in this direction, but the common pattern is batch runs; there’s no widely adopted OSS system running persistent cohorts of synthetic users that evolve over time, watching both your app and competitors release-over-release with baselines and drift detection.[^1_11][^1_16][^1_1]
5. **UX-research-oriented multi-agent roles**
    - Frameworks either have a single “user” agent or very generic planner/worker roles; what’s missing is a canonical pattern of user agents, observer/critic agents, and analyst/reporting agents collaborating around UX research goals and competitive insights.[^1_6][^1_15]
6. **Open MCP-based agent fabric for this domain**
    - ServiceNow’s AI Agent Fabric shows where the enterprise world is going—multi-agent systems with MCP to connect tools and third-party agents—but it’s proprietary and not focused on synthetic UX research or competitive testing.[^1_12]

## Why this is interesting for you

The upshot is that all the *ingredients* exist—browser-driving LLM agents for UX testing, rich persona simulators, web-agent benchmarks, and strong multi-agent orchestration frameworks—but no one has yet combined them into an open, MCP-native “synthetic cohort + UX + competitor testing” framework.

Your idea could focus on:

- MCP-ifying the environment (your app, competitors, data sources as MCP servers).
- Defining UX/adoption-centric agent roles and metrics on top of something like AgentLab + TinyTroupe + a general multi-agent orchestrator.
- Exposing this as a reusable OSS framework that can plug into CI/CD and observability pipelines.

That would be differentiated from current OSS projects and even from the commercial synthetic-user SaaS tools, which are powerful but closed.[^1_17][^1_18]

***

I’ve put a more structured write-up (with specific projects and gaps) into a short report you can refer to as you design your architecture.
<span style="display:none">[^1_19][^1_20][^1_21][^1_22][^1_23][^1_24][^1_25][^1_26][^1_27][^1_28][^1_29]</span>

<div align="center">⁂</div>

[^1_1]: https://lobehub.com/skills/dhamija-claude-workflow-agents-llm-user-testing

[^1_2]: https://github.com/microsoft/TinyTroupe

[^1_3]: https://ar5iv.labs.arxiv.org/html/2502.12561

[^1_4]: https://github.com/neuhai/UXAgent

[^1_5]: https://github.com/vincentkoc/synthetic-user-research

[^1_6]: https://github.com/topics/llm-agents

[^1_7]: https://github.com/ServiceNow/AgentLab

[^1_8]: https://www.getmaxim.ai/blog/browsergym-web-agent-automation/

[^1_9]: https://microsoft.github.io/TinyTroupe/

[^1_10]: https://arxiv.org/html/2507.09788v1

[^1_11]: https://www.reddit.com/r/machinelearningnews/comments/1h73pty/servicenow_releases_agentlab_a_new_opensource/

[^1_12]: https://arxiv.org/html/2308.03688v3

[^1_13]: https://github.com/THUDM/AgentBench

[^1_14]: https://github.com/kaushikb11/awesome-llm-agents

[^1_15]: https://www.firecrawl.dev/blog/best-open-source-agent-frameworks

[^1_16]: https://www.uxia.app/blog/synthetic-users-tools

[^1_17]: https://www.syntheticusers.com

[^1_18]: https://www.servicenow.com/products/ai-agents.html

[^1_19]: https://datatalks.club/blog/open-source-free-ai-agent-evaluation-tools.html

[^1_20]: https://www.langchain.com/articles/llm-observability-tools

[^1_21]: http://themantrix.com/en/blog/the-12-best-synthetic-monitoring-tools-for-2025

[^1_22]: https://www.reddit.com/r/LLMDevs/comments/1kavrga/opensource_library_to_generate_realistic/

[^1_23]: https://www.reddit.com/r/LocalLLaMA/comments/1gr0r4c/tinytroupe_a_new_llmpowered_multiagent_persona/

[^1_24]: https://www.thestack.technology/microsoft-tinytroupe/

[^1_25]: https://www.theagi.company/blog/introducing-real-bench

[^1_26]: https://www.reddit.com/r/LLMDevs/comments/1i6r1h9/top_6_open_source_llm_evaluation_frameworks/

[^1_27]: https://browser-use.com/posts/ai-browser-agent-benchmark

[^1_28]: https://www.youtube.com/watch?v=ziCRuRuEZU8

[^1_29]: https://rdi.berkeley.edu/agentx-agentbeats.html


---

# what plan can you craft for calude code in order ot make the framework I am anticipating?

Let's start with what insights do we as founders or startup users in general need or wnat when testing the applicaiton?

also, what are teh control variables? like user background, user needs user personas user habits and users other ocmpeting applicaitons that they use?

Lets think of how can we simulate as much the same process that happens to get valauble user insights from humans

lets say our input will be our application website and maybe repo and the output hsould be this insights , the AI should be respinsible for making hte different user personas and analyzeet hte insights and go through the website both as funcitnality and as a design

Here's the full framework plan as a downloadable document. Let me walk you through the thinking.

***

## What You Need as a Founder (The Insight Taxonomy)

Founders need two types of signals simultaneously — **behavioral** (what users do) and **attitudinal** (what users feel). Specifically:[^2_1][^2_2][^2_3]

- **Functional**: Task completion rate, error recovery, time-on-task, navigation clarity, onboarding steps-to-first-value
- **Design**: Visual hierarchy, affordance legibility, consistency, information density, accessibility
- **Competitive**: Feature parity gaps, switching cost perception, first-impression differential, pricing page evaluation
- **Adoption**: Learnability curve, "aha moment" identification, churn signals, habit-formation potential
- **Emotional**: Think-aloud narration, frustration moments, NPS-equivalent rating, trust signals[^2_3][^2_4]

***

## Control Variables — The Persona Dimension Matrix

Every persona in the framework is defined by variables that act as dials you tune to control which type of user is being simulated:[^2_5][^2_6][^2_7]


| Dimension | Example Values |
| :-- | :-- |
| Role / Job | Indie founder, Enterprise PM, Non-technical operator |
| Technical Literacy | Power user, Average consumer, Non-technical |
| Industry Vertical | SaaS B2B, Healthcare, Consumer, Fintech |
| Urgency / Context | Evaluating tools, Mid-project crisis, Casual exploration |
| Budget Sensitivity | Bootstrapped (<\$50/mo), Funded (\$50–\$500/mo), Enterprise |
| **Competing Apps** | Notion, Linear, Coda, Salesforce — apps the user "currently uses" |
| Adoption Stage | First-time visitor, Trial user, Replacing current tool |
| Frustration Threshold | High patience vs. churns after 2 dead ends |
| Primary Goal | Productivity, Cost reduction, Team collaboration |
| Device Context | Desktop-first, Mobile-first, Low bandwidth |

The **competing apps** dimension is especially powerful — each persona literally brings a mental model from their current tool, and the agent will navigate those tools too and compare in real time.[^2_8][^2_9]

***

## Simulating the Human UX Research Process

The framework maps every phase of a real research study to an agent role:[^2_10][^2_8]


| Human Phase | Synthetic Agent Equivalent |
| :-- | :-- |
| Recruitment \& screening | **Persona Generator Agent** creates N diverse profiles from the matrix |
| Task design | **Orchestrator** derives tasks from landing page + README |
| Moderated think-aloud session | **Browser User Agent** navigates and narrates in the persona's voice |
| Free-roam unmoderated testing | **Exploration mode**: no task script, agent free-roams |
| Competitive benchmarking | **Competitor Browser Agents** run same tasks on rival apps |
| Post-session interview | **Reflection Agent** "interviews" the persona state after session |
| Affinity mapping \& synthesis | **Analyst Agent** clusters pain points, scores severity |
| Report writing | **Report Agent** produces Markdown + structured JSON |


***

## The Architecture (Claude Code + Playwright MCP)

### Why this stack?

- **Claude Code's `Task` tool** natively spawns parallel subagents with isolated contexts — 5 personas × 3 competitors can run simultaneously with no shared state or race conditions[^2_11][^2_12]
- **Playwright MCP** (Microsoft's official `@playwright/mcp`) lets the LLM control a real browser through the accessibility tree rather than fragile CSS selectors — making navigation decisions genuinely human-like[^2_13][^2_14][^2_15]
- **GitHub MCP** reads the source repo so the framework can flag features that exist in code but are never discoverable through the UI


### The Agent Topology

```
ORCHESTRATOR (reads app URL + repo → derives tasks → spawns everything)
     │
     ├── PERSONA GENERATOR (outputs N persona JSON profiles)
     │
     ├── BROWSER USER AGENTS × N (1 per persona, parallel)
     │     └── Navigates target app with Playwright MCP
     │         Think-aloud trace + UX flags + SUS-proxy scores
     │
     ├── COMPETITOR BROWSER AGENTS × M (1 per competing app)
     │     └── Runs same task list on competitor
     │         Comparative trace with step-count and feature diffs
     │
     └── ANALYST AGENT → REPORT AGENT
           Pain point clustering, SUS scoring, gap matrix
           → Markdown report + structured JSON
```


### Input → Output

- **Input**: `APP_URL` + optional `REPO_URL`, optionally a list of competitor URLs and persona count
- **Output**: Per-persona session traces + aggregated executive report with a competitive scorecard:

| Metric | Your App | Competitor A | Competitor B |
| :-- | :-- | :-- | :-- |
| Avg. Task Completion | 72% | 89% | 85% |
| Steps to Signup | 14 | 7 | 9 |
| SUS-Proxy Score | 61/100 | 78/100 | 74/100 |
| Onboarding Friction Flags | 4/5 personas | 1/5 | 2/5 |


***

## The 4-Week Build Plan for Claude Code

**Week 1 — Foundation**

- Set up `mcp_config.json` with `@playwright/mcp` + GitHub MCP
- Write `AGENTS.md` in `.claude/` folder with all agent role definitions
- Build the persona generator (dimension matrix → persona JSON profiles)
- Build the task deriver (reads landing page + README → task list)

**Week 2 — Browser Agent + Session Traces**

- Write the `browser_agent.md` prompt: persona context, task script, think-aloud instructions, output schema
- Implement session runner that spawns parallel browser subagents via Claude Code's `Task` tool[^2_11]
- Test a single-persona, single-task session and validate trace format
- Add Playwright MCP vision fallback for visual-only elements[^2_14]

**Week 3 — Competitive Agents + Analyst**

- Write `competitor_agent.md`: same-task-different-app instructions
- Implement parallel competitor session spawning alongside user sessions
- Build the Analyst Agent: pain point clustering, SUS-proxy scoring, competitive gap matrix
- End-to-end test: 3 personas × 1 competitor

**Week 4 — Reporting + Hardening**

- Build the Report Agent: Markdown executive report + structured JSON
- Handle edge cases: persona churns mid-session, competitor blocks automation, Playwright timeouts
- Add CLI config: `--personas 5 --competitors notion,linear --url https://yourapp.com`
- Document and publish as open source

***

## The Most Important Design Decision

The session trace schema is the core artifact of the whole system — it's what makes findings comparable across personas, apps, and releases. Every interaction the browser agent takes should emit a structured event: `action`, `observation`, `narration`, `ux_flag`, `severity`. That trace is then what the Analyst Agent reads — not raw HTML or screenshots.[^2_16][^2_17][^2_8]

This is what separates it from a QA automation tool: the output isn't "test passed/failed" — it's a UX narrative that reads like a real user session transcript, with scores attached.

Would you like me to move into writing the actual Claude Code `AGENTS.md`, the persona schema, and the orchestrator prompt as the first concrete implementation artifacts?
<span style="display:none">[^2_18][^2_19][^2_20][^2_21][^2_22][^2_23][^2_24][^2_25][^2_26][^2_27][^2_28][^2_29][^2_30][^2_31][^2_32][^2_33]</span>

<div align="center">⁂</div>

[^2_1]: https://uxarmy.com/blog/ux-metrics-for-designers/

[^2_2]: https://www.revivalpixel.com/blog/ux-metrics-that-matter-most-to-investors/

[^2_3]: https://www.codebridge.tech/articles/top-ux-design-metrics-to-measure-business-success

[^2_4]: https://uxdesign.cc/tracking-the-impact-of-ux-research-a-framework-9e8b8f51599b

[^2_5]: https://www.qualtrics.com/articles/strategy-research/user-personas/

[^2_6]: https://articles.centercentre.com/research_to_personas/

[^2_7]: https://measuringu.com/scientific-personas/

[^2_8]: https://ar5iv.labs.arxiv.org/html/2502.12561

[^2_9]: https://github.com/vincentkoc/synthetic-user-research

[^2_10]: https://github.com/neuhai/UXAgent

[^2_11]: https://www.mindstudio.ai/blog/multi-agent-chrome-automation-claude-code

[^2_12]: https://maecapozzi.com/blog/building-a-multi-agent-orchestrator

[^2_13]: https://www.builder.io/blog/playwright-mcp-server-claude-code

[^2_14]: https://codemify.com/pageplaywritestepbystep

[^2_15]: https://github.com/microsoft/playwright-mcp

[^2_16]: https://www.mabl.com/blog/ai-agent-frameworks-end-to-end-test-automation

[^2_17]: https://www.linkedin.com/pulse/ai-agent-orchestration-innovators-guide-claude-multi-agent-yang-kihsc

[^2_18]: https://www.linkedin.com/posts/edwin-emmanuel-roy-74a381205_ux-metrics-every-founder-should-be-obsessing-activity-7353407321538019332-Dr8U

[^2_19]: https://www.reddit.com/r/UXResearch/comments/1pn5r30/what_uxmetrics_are_you_usingfamiliar_with_for/

[^2_20]: https://foundersnetwork.com/startup-metrics/

[^2_21]: https://www.labellerr.com/blog/browser-use-agent/

[^2_22]: https://www.linkedin.com/posts/timvipond_25-must-track-kpis-for-every-startup-founder-activity-7308134014366687232-2rNx

[^2_23]: https://www.reddit.com/r/LocalLLaMA/comments/1ns668t/how_to_fundamentally_approach_building_an_ai/

[^2_24]: https://www.nngroup.com/articles/personas-study-guide/

[^2_25]: https://www.browserless.io/blog/building-autonomous-browser-agents-with-playwright-claude-opus-4-5

[^2_26]: https://www.youtube.com/watch?v=efctPj6bjCY

[^2_27]: https://www.reddit.com/r/ClaudeCode/comments/1r03a0t/claude_code_playwright_cli_superpowers/

[^2_28]: https://www.linkedin.com/pulse/playwright-2025-ai-powered-automation-real-time-web-testing-patel-rrfwf

[^2_29]: https://www.reddit.com/r/ClaudeCode/comments/1rjq8xi/has_anyone_successfully_deployed_ai_browser/

[^2_30]: https://github.com/lackeyjb/playwright-skill

[^2_31]: https://developers.cloudflare.com/browser-rendering/playwright/playwright-mcp/

[^2_32]: https://www.reddit.com/r/ClaudeAI/comments/1l11fo2/how_i_built_a_multiagent_orchestration_system/

[^2_33]: https://www.youtube.com/watch?v=xOO8Wt_i72s


---

# we need to ensure we get both qualitiave and qunatiive insights.

Here's the full dual-layer insight architecture as a downloadable spec.

***

## The Core Rule: Every Finding Has Two Faces

The guiding design principle is that **no metric exists without a narrative, and no quote exists without a score**. NNG's mixed-methods research framework defines this precisely: quantitative data tells you *what* is broken and at what scale, while qualitative data tells you *why* it's broken and what it means to the user. Both layers feed each other — the number flags where to look, the quote explains what to do about it.[^3_1][^3_2]

***

## Layer 1 — Quantitative Signals (The "What")

### Task Performance Metrics (from browser agent action trace)

| Metric | How Agent Measures It | Why It Matters |
| :-- | :-- | :-- |
| **Task Completion Rate** | % of tasks fully completed per persona | Core functional health signal |
| **Steps to First Value** | Actions before core value is visible | Directly predicts activation rate |
| **Error Rate** | Wrong clicks, 404s, dead ends, retries | >2 per task = friction flag |
| **Onboarding Field Count** | Required inputs before trial access | Industry best practice: ≤3 fields |
| **Navigation Depth to Feature** | Clicks to reach a core feature | >3 clicks = buried feature |
| **Recovery Rate** | % of errors self-recovered without help | <60% = poor error design |
| **Competitive Step Delta** | Your steps − competitor steps, same task | Negative = structural disadvantage |

### SUS-Proxy Score

The System Usability Scale is a validated 10-item questionnaire producing a 0–100 score, where 68 is the industry average across 5,000+ products and above 80 is considered "good." After each task, the browser agent responds to all 10 SUS items in character as the persona. This produces a per-persona score that is averaged across your app and each competitor — giving you a single comparable usability number.[^3_3][^3_4][^3_5][^3_6]

**Grading scale:** ≤50 = Unacceptable → 51–67 = Marginal → 68–84 = Good → 85–100 = Excellent

### Google HEART Framework Scores

HEART (Happiness, Engagement, Adoption, Retention, Task Success) is Google's UX measurement framework that connects user experience signals to business goals. Each dimension maps to a signal the agent can derive from the session:[^3_7][^3_8][^3_9]


| HEART Dimension | Agent Derives It From |
| :-- | :-- |
| **Happiness** | SUS score + sentiment tone of narration stream |
| **Engagement** | Features explored ÷ features available |
| **Adoption** | Post-session "would you commit to this?" intent signal |
| **Retention** | Learnability: would session 2 be meaningfully faster? |
| **Task Success** | TCR + error rate + recovery rate composite |


***

## Layer 2 — Qualitative Signals (The "Why")

### Think-Aloud Narration Stream

Every browser agent navigates in character, narrating continuously as the persona. These are captured verbatim:[^3_10][^3_1]

> *Maya (bootstrapped founder, hitting the signup form):*
> *"Why do I need to tell you my company size before I've even seen the product? I would have left by now."*

> *Dev-Eric (engineer evaluating for team adoption):*
> *"The API docs are hidden under 'Help Center,' not 'Developers.' This feels like a marketing-first product. In Linear, the API is front and center."*

### Friction Event Log (Categorized + Severity-Rated)

Every confusion or error moment is tagged, not just logged:[^3_11][^3_10]


| Friction Type | Example Narration Signal |
| :-- | :-- |
| `navigation_confusion` | "Where is the export button?" |
| `copy_ambiguity` | "What does 'workspace' mean here?" |
| `onboarding_wall` | "Three modals before I see the product" |
| `feature_absent` | "No bulk action — deal-breaker" |
| `trust_signal_missing` | "No pricing transparency — sketchy" |
| `competitor_superiority` | "Notion handles this in one click" |
| `delight_moment` | "Oh that animation is smooth — nice" |

### Post-Session Interview (Persona Voice)

After each session, the Reflection Agent "interviews" the persona in character with 7 standardized questions — the qualitative counterpart to the SUS score:

1. What was your first impression?
2. What was the most confusing moment?
3. What feature, if any, genuinely excited you?
4. Would you choose this over [Competitor]? Why?
5. What would need to change for you to commit?
6. What would you tell a colleague about this product?
7. Rate your confidence you could use this daily: 1–10

### Design Critic Agent

A dedicated sub-agent that observes without performing tasks — auditing visual hierarchy, color/contrast (WCAG AA), typography consistency, component pattern coherence, information density, and trust signals (testimonials, pricing transparency, security badges). Every finding is severity-rated: `critical / major / minor / suggestion`.

### Code-to-UI Gap Analysis

When a GitHub repo is provided, the framework reads the component tree and compares it to what's actually navigable in the live UI — surfacing features that exist in code but are never discoverable through normal navigation.[^3_12]

***

## How the Two Layers Are Integrated

The integration is the most critical design decision. Every issue card in the output combines both layers into a single actionable finding:[^3_10][^3_11]

```
Issue: Signup form has excessive required fields
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quantitative:  TCR on signup task: 58%  |  Competitor A: 89%
               Avg steps: 14           |  Competitor A: 7
               Affected: 4 of 5 personas

Qualitative:   "I don't trust this product enough to give you
                my company data before I've seen anything."
                — Maya (onboarding_wall, severity: critical)

               "The 'Get Started' button goes to a contact form,
                not a signup. I'm not booking a demo to try a tool."
                — Dev-Eric (trust_signal_missing, severity: critical)

Fix:           Reduce to email + password only (3 fields max)
               Move 'Company Size' to post-signup checklist
Expected Impact: +25–30% TCR on signup task
```

This is what makes the output founder-ready rather than researcher-ready — every finding is paired with a *business impact estimate* and a *specific fix.*

***

## The Complete Measurement Stack at a Glance

| Layer | Instrument | Output | Answers |
| :-- | :-- | :-- | :-- |
| **Quant** | Task Completion Rate | % per task | Did it work? |
| **Quant** | Steps-to-Value | Integer, vs. competitor | How efficient? |
| **Quant** | SUS-Proxy Score | 0–100 vs. industry avg | How usable overall? |
| **Quant** | HEART Scores | 5-dim radar | What's weakest? |
| **Quant** | Competitive Step Delta | Your steps − theirs | Where are we losing? |
| **Qual** | Think-Aloud Narration | Verbatim persona quotes | What did they feel? |
| **Qual** | Friction Event Log | Tagged by type + severity | What specifically broke? |
| **Qual** | Post-Session Interview | Persona Q\&A | Would they adopt? |
| **Qual** | Design Critic Audit | Severity-rated findings | What looks wrong? |
| **Qual** | Code-to-UI Gap Analysis | Feature list | What's hidden? |
| **Integrated** | Issue Cards | Quant + quote + fix | What to build next? |

The session trace schema — the JSON structure every browser agent emits — is what binds all of this together. Want me to write the actual schema file and the `AGENTS.md` prompt file next so you have real Claude Code artifacts to start building from?
<span style="display:none">[^3_13][^3_14][^3_15][^3_16]</span>

<div align="center">⁂</div>

[^3_1]: https://www.nngroup.com/articles/mixed-methods-research/

[^3_2]: https://www.userinterviews.com/ux-research-field-guide-chapter/qualitative-vs-quantitative-vs-mixed-methods

[^3_3]: https://yourcx.io/en/blog/2024/09/system-usability-scale-sus-in-ux-research-measuring-user-experience-effectively/

[^3_4]: https://ixdf.org/literature/article/system-usability-scale

[^3_5]: https://cleverx.com/blog/maximizing-user-experience-with-the-usability-scale

[^3_6]: https://www.teacuplab.com/blog/what-is-sus-scale-how-to-use-it-measure-usability/

[^3_7]: https://www.statsig.com/perspectives/heart-framework-measuring-ux

[^3_8]: https://usersnap.com/blog/heart-framework/

[^3_9]: https://www.lyssna.com/blog/google-heart-framework/

[^3_10]: https://cleverx.com/blog/mixed-methods-research-complete-guide-to-integrating-qualitative-and-quantitative-methods/

[^3_11]: https://www.looppanel.com/blog/mixed-methods-research

[^3_12]: https://github.com/neuhai/UXAgent

[^3_13]: https://www.testingtime.com/en/blog/mixed-methods-ux-research/

[^3_14]: https://www.qualtrics.com/articles/strategy-research/mixed-methods-research/

[^3_15]: https://xperiencewave.com/resources/blogs/mixed-methods-research-ux-design

[^3_16]: https://www.youtube.com/watch?v=M6Uh8F0U4u8


---

# what steps or design choice can we take in order to ensure that we have some control or choice over what personas and backgrounds do the recruited users have? Also, how cna we make sure that we find all the relevant compeittiors based on our application? how can ensure that basedon the application readme and url (lets see I will even give you the repo or hte codebase to determien the features granuallry to account for hte caase that I might be biased and didn't right my readme well) how can I make sure you understand hte applicaiton well? what information I need you to dig and infer about the application from the code? "

Here's the full design spec as a downloadable document.

***

## Part 1 — Persona Control: Guided Sampling, Not Pure Generation

The core design principle mirrors how real UX research recruiting works: researchers define *criteria*, a recruiter finds people matching those criteria. Founders define the **shape**, the AI fills in the **richness and variance**.[^4_1][^4_2][^4_3]

### Three Levels of Control

**Level 1 — Full Autopilot**: No input. The AI infers your ICP entirely from the codebase and landing page, then generates N diverse personas. Best for cold, unbiased discovery.

**Level 2 — Segment Constraints** *(recommended)*: You provide a `persona_config.json` with *constraints*, not full personas. You define segments like "3 ICP personas + 2 adjacent buyers + 1 adversarial stress-test user with very low patience." The AI fills in everything else with diversity.

**Level 3 — Fully Specified**: You supply pre-built persona profiles from your own research. The AI uses them as-is. Best when you already have validated user archetypes.

### Diversity Enforcement

The generator tracks a **variance matrix** and rejects any persona that's too similar to an existing one — preventing the classic LLM failure of generating 5 nearly identical profiles:[^4_2][^4_3]


| Dimension | Rule |
| :-- | :-- |
| Technical literacy | At least 3 distinct levels across all personas |
| Role/title | No two identical roles |
| Frustration threshold | At least 1 high-patience + 1 low-patience |
| Competing apps | Max 50% overlap between any two personas' lists |
| Adoption intent | At least 1 "not actively looking" + 1 "ready to switch" |

### Persona Persistence

Each persona gets a `persona_id` and is reused across runs. When you test v1.0 vs. v2.0, the **same persona profile** runs both — meaning metric changes are attributable to product changes, not persona variance.

***

## Part 2 — Competitor Discovery: 4-Signal Triangulation

No single source reliably identifies all competitors. The framework runs a 4-source pipeline and merges signals with confidence scores:

### Signal 1 — Self-Identification from the App Itself

The application often reveals its own competitive landscape. Playwright scrapes the live site for:[^4_4]

- Landing page copy mentioning competitors directly ("the Notion alternative")
- Pricing page "Why us vs. them" comparison tables
- Blog posts with titles like "X vs Y" or "Alternatives to X"
- "Works with" integration sections in the footer


### Signal 2 — G2 and Capterra Category Classification

Once a category keyword is extracted, the framework queries software discovery platforms:[^4_5][^4_6][^4_7]

- **G2**: Best for initial category-level landscape mapping and understanding the top players[^4_5]
- **Capterra**: Returns feature checklists per category (100,000+ products) — useful for automated feature comparison[^4_6]
- **AlternativeTo**: Crowdsourced — surfaces niche or newer competitors not yet on G2/Capterra[^4_8]

Critically, G2/Capterra also return **reviewer demographics** (role, company size, industry) — which flows back into persona generation ("what roles actually use this category of tool?")

### Signal 3 — Structured Web Search

The Competitor Discovery Agent auto-generates search queries from what it learned about the app:

```
"{inferred_category} tools 2026"
"best {core_feature} software for {ICP_role}"
"alternatives to {self_identified_competitor}"
"{primary_job_to_be_done} software"
```


### Signal 4 — Competitor Signals Hidden in the Codebase

The code reveals competitors better than any marketing copy can. The agent scans for:

- **Import/migration utilities**: Files named `import-from-notion.ts`, `migrate-confluence.js` name direct competitors
- **OAuth providers**: What apps users sign in with — reveals their existing tool ecosystem
- **Zapier/Make webhooks**: Lists the apps users connect *from* — adjacent competitor ecosystem
- **`package.json` dependencies**: Competitive category signals from third-party integrations

All four signals merge into a ranked competitor list with confidence scores, which founders can override before sessions begin.

***

## Part 3 — Application Understanding from Code: The App Intelligence Agent

### The Design Principle: The Code Doesn't Lie

A README reflects what a founder *wants* users to know. The code reflects what the product *actually does*. The **App Intelligence Agent** runs before any sessions and extracts 5 layers of intelligence from the codebase:[^4_9][^4_10][^4_11]

### Layer 1 — Route and Navigation Map

Scans `/pages/`, `/app/`, `/routes/` directory structures and router definitions to build a **complete site map** — every URL that exists, not just what's linked in the nav. This surfaces hidden admin pages, unlinked features, and protected routes that no browser navigation would ever find.[^4_11]

### Layer 2 — Feature Inventory

| What to Scan | What It Reveals |
| :-- | :-- |
| Feature flag definitions | Features that exist but are gated or hidden from some users |
| `/api/` route handlers | Every action the backend supports, even if no UI exposes it |
| Database schema / Prisma models | Full data model — what entities and relationships really exist |
| Test files (`*.spec.ts`) | **Test cases describe intended behavior better than most READMEs** |

### Layer 3 — Integration and Ecosystem Map

- `package.json` reveals the full tech stack and third-party services
- OAuth providers signal which tool ecosystems your users already live in
- Payment provider config exposes pricing tiers and feature gating logic
- Import/export utilities name the platforms users migrate from and to


### Layer 4 — UX Intent Signals (The Hidden Documentation)

| Signal | File Location | What It Tells You |
| :-- | :-- | :-- |
| Email templates | `/emails/` | What events the team thinks are worth notifying users about |
| `track()` / `identify()` calls | Throughout codebase | What the team considers important user actions |
| Error message strings | Constants files | Where the team *already knows* users will hit problems |
| Tooltip/help text | UI copy files | Where the team *expects* users to be confused |
| `TODO` / `FIXME` comments | Throughout | Known issues — don't let the agent test these as if they were finished |
| Commented-out code | Throughout | Recently removed or experimental features |

### Layer 5 — README vs. Reality Gap Analysis *(most founder-valuable)*

The agent explicitly compares what the README claims against what exists in the code:

```
README claims:  "Export to PDF, CSV, and Markdown"
Code check:     PDF export handler   → FOUND ✓
                CSV export handler   → FOUND ✓
                Markdown export      → NOT FOUND (commented-out stub only)

Result: "Markdown export" is a README overpromise.
        → Flagged as: value_prop_gap + feature_discoverability_gap
```

This catches the places where marketing and engineering have silently diverged — something no founder can self-identify because they're too close to their own product.

### The App Brief

All 5 layers produce a structured `app_brief.json` that becomes the **single source of truth** shared with every other agent — ensuring that persona goals, task scripts, and competitive analysis are all grounded in what the product actually does, not what was intended.

***

## How All Three Systems Connect

```
INPUT: app URL + GitHub repo + optional persona_config.json
           │
           ▼
  APP INTELLIGENCE AGENT (code → ground-truth app_brief)
           │
    ┌──────┴──────────────────────┐
    ▼                             ▼
COMPETITOR DISCOVERY         PERSONA GENERATOR
(4 signals: site scrape,     (segment constraints +
 G2/Capterra, web search,     variance matrix +
 code integrations)           screening check)
    │                             │
    └──────────┬──────────────────┘
               ▼
         TASK DERIVER
    (app_brief + personas → task list)
               │
               ▼
    BROWSER + COMPETITOR AGENTS
         (run sessions)
```

The next natural step is writing the actual `app_intelligence_agent.md` prompt and the `app_brief.json` schema as the first concrete Claude Code artifacts — want to move into that?
<span style="display:none">[^4_12][^4_13][^4_14][^4_15][^4_16][^4_17][^4_18][^4_19][^4_20][^4_21][^4_22][^4_23][^4_24][^4_25][^4_26][^4_27][^4_28][^4_29][^4_30]</span>

<div align="center">⁂</div>

[^4_1]: https://www.uxmatters.com/mt/archives/2024/05/ux-research-recruiting-a-7-step-checklist.php

[^4_2]: https://uxarmy.com/blog/persona-based-testing/

[^4_3]: https://www.usersense.com/knowledge-base/recruiting-test-users-for-ux-a-complete-guide

[^4_4]: https://zapier.com/blog/competitor-analysis-tools/

[^4_5]: https://technologymatch.com/blog/g2-vs-capterra-vs-trustpilot-vs-technologymatch-which-discovery-platform-is-best-for-it-leaders

[^4_6]: https://www.openwebninja.com/request-apis/capterra

[^4_7]: https://www.reddit.com/r/SaaS/comments/1axfwul/for_capturing_saas_reviews_trustpilot_vs_capterra/

[^4_8]: https://launchdirectories.com/blog/top-product-hunt-alternatives-for-a-successful-launch-2025

[^4_9]: https://arxiv.org/html/2503.17502v1

[^4_10]: https://dev.to/eabait/beyond-code-generation-llms-for-code-understanding-3ldn

[^4_11]: https://advanced-stack.com/resources/how-to-extract-and-analyze-a-code-base-with-llms.html

[^4_12]: https://github.com/jbellis/llmap

[^4_13]: https://www.reddit.com/r/ChatGPTCoding/comments/1coskgn/how_to_help_llms_understand_your_code/

[^4_14]: https://www.credencys.com/blog/automating-product-taxonomy-categorization-with-artificial-intelligence/

[^4_15]: https://discuss.huggingface.co/t/what-is-the-best-approach-to-let-llm-to-learn-company-internal-legacy-system/148239

[^4_16]: https://advantailabs.com/blog/ai-saas-product-classification-criteria

[^4_17]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11398444/

[^4_18]: https://millipixels.com/blog/ai-saas-product-classification-criteria

[^4_19]: https://essay.utwente.nl/fileshare/file/103120/Reefman_MA_EEMCS.pdf

[^4_20]: https://bigid.com/discovery-classification/

[^4_21]: https://www.g2.com/products/capterra/competitors/alternatives

[^4_22]: https://www.g2.com/products/saas-scout/competitors/alternatives

[^4_23]: https://www.g2.com/products/softwaresuggest/competitors/alternatives

[^4_24]: https://github.com/cedricrupb/code_ast

[^4_25]: https://stackoverflow.com/questions/19379494/modern-way-of-accessing-ast-in-java

[^4_26]: https://blastra.io/blog/g2-capterra-vendor-pricing-compared

[^4_27]: https://www.g2.com/products/product-hunt/competitors/alternatives

[^4_28]: https://dev.to/balapriya/abstract-syntax-tree-ast-explained-in-plain-english-1h38

[^4_29]: https://www.g2.com/products/software-advice/competitors/alternatives

[^4_30]: https://www.producthunt.com/products/competitors-app

