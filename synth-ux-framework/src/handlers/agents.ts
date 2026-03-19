import { loadAgentDefinition } from '../utils/index.js';

export function handleSynthUxFullTest(args: Record<string, unknown>): string {
  const orchestrator = loadAgentDefinition('orchestrator');
  const heuristic = loadAgentDefinition('heuristic_evaluator');
  const persona = loadAgentDefinition('persona_generator');
  const browser = loadAgentDefinition('browser_user');
  const report = loadAgentDefinition('report');

  return `# Synth-UX Full Test Protocol

## Target: ${args.url}
${args.credentials ? `## Credentials: ${JSON.stringify(args.credentials)}` : ''}
${args.focus ? `## Focus: ${args.focus}` : '## Focus: full'}

You are now executing a comprehensive synthetic UX test. Follow these phases IN ORDER:

---

## PHASE 1: HEURISTIC EVALUATION

${heuristic}

---

## PHASE 2: PERSONA GENERATION

${persona}

---

## PHASE 3: SESSION SIMULATION

${browser}

---

## PHASE 4: REPORT GENERATION

${report}

---

## MCP Tools to Use

You MUST use the \`cursor-ide-browser\` MCP server for all browser operations.

### Required Browser MCP Tools:
| Tool | Usage |
|------|-------|
| \`browser_navigate\` | Go to URLs |
| \`browser_snapshot\` | Get page structure (ALWAYS before clicking) |
| \`browser_take_screenshot\` | Capture visual evidence |
| \`browser_click\` | Click elements by ref |
| \`browser_fill\` | Fill form fields (clears first) |
| \`browser_type\` | Type text (appends) |
| \`browser_lock\` | Lock browser for exclusive access |
| \`browser_unlock\` | Release browser when done |
| \`browser_tabs\` | List/manage tabs |

### Browser Workflow:
1. \`browser_navigate\` to the URL
2. \`browser_snapshot\` to get element refs
3. \`browser_lock\` before any interactions
4. Perform actions (\`browser_click\`, \`browser_fill\`)
5. \`browser_snapshot\` after each action to see result
6. \`browser_take_screenshot\` for evidence
7. \`browser_unlock\` when switching contexts

### Evidence Collection:
- Take screenshots at key moments (errors, successes, confusion points)
- Record the element refs and visible text in your narration
- Since video recording is not available, compensate with frequent screenshots

## Begin Now

Start with Phase 1: Navigate to ${args.url} and perform heuristic evaluation.
`;
}

export function handleHeuristicEvaluate(args: Record<string, unknown>): string {
  const agent = loadAgentDefinition('heuristic_evaluator');
  return `# Heuristic Evaluation Task

## Target: ${args.url}
${args.pages ? `## Pages to evaluate: ${JSON.stringify(args.pages)}` : '## Pages: Auto-discover from navigation'}

${agent}

## Begin Now

Navigate to ${args.url} and start the evaluation.
`;
}

export function handlePersonaGenerate(args: Record<string, unknown>): string {
  const agent = loadAgentDefinition('persona_generator');
  return `# Persona Generation Task

## App Context: ${args.app_context}
## Count: ${args.count || 5}
${args.constraints ? `## Constraints: ${args.constraints}` : ''}

${agent}

## Begin Now

Generate the personas based on the app context provided.
`;
}

export function handleSessionSimulate(args: Record<string, unknown>): string {
  const browser = loadAgentDefinition('browser_user');
  const aha = loadAgentDefinition('aha_detector');

  return `# Session Simulation Task

## Target: ${args.url}
## Persona: ${JSON.stringify(args.persona)}
## Tasks: ${JSON.stringify(args.tasks || ['Explore the app', 'Complete primary action'])}
${args.credentials ? `## Credentials: ${JSON.stringify(args.credentials)}` : ''}

${browser}

---

## Aha Moment Detection

${aha}

## Begin Now

Lock the browser and simulate the session as ${(args.persona as { name: string }).name}.
`;
}

export function handleJtbdAnalyze(args: Record<string, unknown>): string {
  const agent = loadAgentDefinition('jtbd_mapper');
  return `# Jobs-to-Be-Done Analysis

## Target: ${args.url}
${args.app_description ? `## App Description: ${args.app_description}` : ''}

${agent}

## Begin Now

Analyze the landing page and map the JTBD.
`;
}

export function handleProblemSeverityClassify(args: Record<string, unknown>): string {
  const agent = loadAgentDefinition('problem_severity');
  return `# Problem Severity Classification

## Problem Statement: ${args.problem_statement}
## Personas to Classify: ${JSON.stringify(args.personas)}

${agent}

## Begin Now

Classify each persona's problem severity level.
`;
}

export function handleReflectionInterview(args: Record<string, unknown>): string {
  const agent = loadAgentDefinition('reflection');
  return `# Post-Session Reflection Interview

## Session Summary: ${args.session_summary}
## Persona: ${JSON.stringify(args.persona)}

${agent}

## Begin Now

Conduct the 12-question interview in character as ${(args.persona as { name: string }).name}.
`;
}

export function handleReportGenerate(args: Record<string, unknown>): string {
  const agent = loadAgentDefinition('report');
  const calibration = loadAgentDefinition('calibration');

  return `# Report Generation

## App Name: ${args.app_name}
## Findings: ${JSON.stringify(args.findings, null, 2)}

${agent}

---

## Calibration & Validity

${calibration}

## Begin Now

Generate the comprehensive report.
`;
}

export function handleSegmentHeatMap(args: Record<string, unknown>): string {
  const agent = loadAgentDefinition('segment_heat_mapper');
  return `# Segment Heat Map Analysis

## Problem Statement: ${args.problem_statement}
## Personas: ${JSON.stringify(args.personas, null, 2)}

${agent}

## Begin Now

Analyze the personas and generate the segment heat map.
`;
}

export function handleVoiceOfUserDigest(args: Record<string, unknown>): string {
  const agent = loadAgentDefinition('voice_of_user');
  return `# Voice of User Weekly Digest

## Week: ${args.week_of || 'Current'}
## Sessions: ${JSON.stringify(args.sessions, null, 2)}

${agent}

## Begin Now

Generate the Voice of User digest.
`;
}

export function handleListAgents(): string {
  const agents = [
    { name: 'orchestrator', purpose: 'Central coordinator with state machine for full test execution' },
    { name: 'heuristic_evaluator', purpose: "Nielsen's 10 Heuristics + WCAG 2.1 AA accessibility audit" },
    { name: 'first_click_analyzer', purpose: 'Information scent testing and first-click analysis' },
    { name: 'jtbd_mapper', purpose: 'Jobs-to-Be-Done mapping - functional, emotional, social jobs' },
    { name: 'problem_severity', purpose: 'Hair on Fire → Latent problem severity classification' },
    { name: 'persona_generator', purpose: '16-dimension synthetic persona generation with diversity rules' },
    { name: 'browser_user', purpose: 'Session simulation with think-aloud narration and metrics' },
    { name: 'aha_detector', purpose: 'Value realization moment detection' },
    { name: 'reflection', purpose: '12-question post-session interview including Sean Ellis question' },
    { name: 'dual_coder', purpose: "Cohen's Kappa inter-rater reliability for qualitative coding" },
    { name: 'segment_heat_mapper', purpose: 'PMF probability scoring by persona segment' },
    { name: 'calibration', purpose: 'Confidence scoring and validity disclaimers' },
    { name: 'ab_hypothesis_generator', purpose: 'Generate A/B test hypotheses from UX findings' },
    { name: 'clip_curator', purpose: 'Extract video clips with one-sentence summaries' },
    { name: 'voice_of_user', purpose: 'Weekly digest: The Win, The Pain, The Surprise' },
    { name: 'report', purpose: 'RICE-prioritized report with decision framework' },
  ];

  return `# Available Synth-UX Agents

| Agent | Purpose |
|-------|---------|
${agents.map(a => `| \`${a.name}\` | ${a.purpose} |`).join('\n')}

## How They Work Together

\`\`\`
synth_ux_full_test
    │
    ├── Phase 0: Heuristic Evaluation
    │   └── heuristic_evaluator → hypothesis_list
    │
    ├── Phase 1: Understanding
    │   ├── jtbd_mapper → jobs mapping
    │   ├── problem_severity → severity matrix
    │   └── first_click_analyzer → scent report
    │
    ├── Phase 2: Persona Generation
    │   └── persona_generator → personas.json (5+ diverse)
    │
    ├── Phase 3: Session Simulation
    │   ├── browser_user → session traces
    │   ├── aha_detector → aha moments
    │   └── reflection → interview responses
    │
    ├── Phase 4: Analysis
    │   ├── dual_coder → validated themes
    │   ├── segment_heat_mapper → PMF heat map
    │   └── calibration → confidence scores
    │
    └── Phase 5: Output
        ├── report → executive dashboard + decision framework
        ├── ab_hypothesis_generator → test hypotheses
        └── voice_of_user → weekly digest
\`\`\`

## Using Individual Tools

You can call individual tools for focused analysis:
- \`heuristic_evaluate\` - Quick audit only
- \`persona_generate\` - Just create personas
- \`session_simulate\` - Test as one persona
- \`jtbd_analyze\` - Jobs mapping only
`;
}
