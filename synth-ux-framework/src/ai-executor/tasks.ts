import fs from 'fs';
import { callLLM, callLLMWithImage } from './llm.js';
import { parseJsonArray, parseJsonObject } from './json.js';
import { searchCompetitors, formatSearchResultsForLLM } from './web-search.js';
import { fetchGitHubRepoInfo, generateAppBriefFromGitHub, isGitHubUrl, GitHubAppBrief } from './github.js';
import {
  ABHypotheses,
  AnalysisResult,
  AppBrief,
  CalibrationReport,
  Clip,
  ClipLibrary,
  CompetitorProfile,
  DesignAudit,
  DualCodingResult,
  FigmaAnnotationBatch,
  FirstClickAnalysis,
  HeuristicEvaluation,
  JTBDAnalysis,
  Persona,
  ProblemSeverityMatrix,
  ReflectionInterview,
  SegmentHeatMap,
  SessionTrace,
  StudyHighlight,
  TaskList,
  TimeBasedMetrics,
  VisualCapture,
  WeeklyDigest,
} from './types.js';

export async function generatePersonas(
  appContext: string,
  count: number = 5
): Promise<Persona[]> {
  const prompt = `You are a UX research expert. Generate ${count} diverse synthetic user personas for testing this application:

${appContext}

Requirements:
- 3 personas should be Ideal Customer Profile (ICP) - people who NEED this product
- 1 persona should be adjacent market - could use it but not primary target
- 1 persona should be adversarial - skeptical, impatient, will find problems

For each persona include:
- id (snake_case)
- name
- age
- role/job
- technical_literacy (high/medium/low)
- patience_level (high/medium/low)
- goals (what they want to achieve)
- frustrations (current pain points)
- context (their situation)
- problem_severity (1-4, where 4 is "hair on fire")

Return ONLY valid JSON array of personas, no explanation.`;

  const text = await callLLM(prompt, 4000);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = parseJsonArray<any>(text, 'Failed to parse personas from AI response');
  return raw.map(p => ({
    ...p,
    role: p.role ?? p['role/job'] ?? p.job ?? 'Unknown',
    goals: Array.isArray(p.goals) ? p.goals : [p.goals],
    frustrations: Array.isArray(p.frustrations) ? p.frustrations : [p.frustrations],
  })) as Persona[];
}

export async function simulateSession(
  persona: Persona,
  pageContent: string,
  pageUrl: string,
  tasks: string[]
): Promise<SessionTrace> {
  const prompt = `You are simulating a user testing a web application. You ARE this persona:

PERSONA:
- Name: ${persona.name}
- Age: ${persona.age}
- Role: ${persona.role}
- Technical literacy: ${persona.technical_literacy}
- Patience level: ${persona.patience_level}
- Goals: ${persona.goals.join(', ')}
- Frustrations: ${persona.frustrations.join(', ')}
- Context: ${persona.context}

PAGE URL: ${pageUrl}

PAGE CONTENT (from accessibility snapshot):
${pageContent.substring(0, 3000)}

TASKS TO ATTEMPT:
${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Simulate this persona's experience with THINK-ALOUD narration. For each action:
1. What would they try to do?
2. What would they think/say out loud?
3. Would they encounter friction? (mark as ux_flag)
4. Would they experience delight?
5. Would they have an "aha moment" where value clicks?

Return JSON with this structure:
{
  "persona_id": "${persona.id}",
  "actions": [
    {"timestamp": 0, "action": "view_page", "narration": "...", "ux_flag": null},
    {"timestamp": 5000, "action": "click", "element": "...", "narration": "...", "ux_flag": "confusion", "severity": "medium"}
  ],
  "aha_moment": {"occurred": true/false, "trigger": "...", "time_seconds": ..., "quote": "..."},
  "friction_points": ["...", "..."],
  "delight_moments": ["...", "..."]
}

Return ONLY valid JSON, no explanation.`;

  const text = await callLLM(prompt, 4000);
  return parseJsonObject<SessionTrace>(text, 'Failed to parse session trace from AI response');
}

export async function conductInterview(
  persona: Persona,
  sessionSummary: string
): Promise<ReflectionInterview> {
  const prompt = `You are conducting a post-session interview. You ARE this persona responding to questions:

PERSONA:
- Name: ${persona.name}
- Role: ${persona.role}
- Technical literacy: ${persona.technical_literacy}
- Patience level: ${persona.patience_level}
- Problem severity: ${persona.problem_severity}/4

SESSION SUMMARY:
${sessionSummary}

Answer these 12 questions IN CHARACTER as ${persona.name}:

1. What was your overall impression of the product?
2. What was the most confusing part?
3. What was the most delightful part?
4. How would you feel if you could no longer use this product? (SEAN ELLIS: very_disappointed / somewhat_disappointed / not_disappointed)
5. Would you use this again tomorrow? Why or why not?
6. Who specifically would you recommend this to? What would you tell them?
7. What would you pay for this? What do you currently pay for alternatives?
8. What would need to change for you to commit to using this regularly?
9. What's missing that you expected to find?
10. How does this compare to [competitor/alternative]?
11. What was your "aha moment" if any?
12. On a scale of 1-10, how likely are you to recommend this?

Return JSON:
{
  "persona_id": "${persona.id}",
  "persona_name": "${persona.name}",
  "questions": [
    {"question": "...", "answer": "...", "insight": "..."}
  ],
  "sean_ellis_score": "very_disappointed|somewhat_disappointed|not_disappointed",
  "would_return": true/false,
  "referral_specificity": "specific person/group they'd recommend to",
  "willingness_to_pay": "$X/month"
}

Return ONLY valid JSON, no explanation.`;

  const text = await callLLM(prompt, 4000);
  return parseJsonObject<ReflectionInterview>(text, 'Failed to parse interview from AI response');
}

export async function analyzeJTBD(
  appDescription: string,
  landingPageContent: string
): Promise<JTBDAnalysis> {
  const prompt = `Analyze the Jobs-to-Be-Done for this application:

APP DESCRIPTION:
${appDescription}

LANDING PAGE CONTENT:
${landingPageContent.substring(0, 2000)}

Return a JTBD analysis as JSON:
{
  "functional_job": "Help me [verb] [object] so I can [outcome]",
  "emotional_job": "Make me feel [emotion] when [situation]",
  "social_job": "Help me appear [perception] to [audience]",
  "current_solutions": ["spreadsheets", "competitor X", ...],
  "switching_triggers": ["lost a deal", "manager asked for report", ...],
  "switching_anxieties": ["data migration", "learning curve", ...],
  "hiring_criteria": {
    "must_have": [...],
    "nice_to_have": [...],
    "dealbreakers": [...]
  }
}

Return ONLY valid JSON, no explanation.`;

  const text = await callLLM(prompt, 2000);
  return parseJsonObject<JTBDAnalysis>(text, 'Failed to parse JTBD from AI response');
}

export async function discoverCompetitors(
  appName: string,
  appDescription: string,
  landingPageContent: string,
  count: number = 5
): Promise<CompetitorProfile[]> {
  // Step 1: Perform web search for competitors (if API key configured)
  const searchResults = await searchCompetitors(appName, appDescription);
  const webSearchContext = formatSearchResultsForLLM(searchResults);
  const usedWebSearch = searchResults.some(sr => sr.source === 'tavily' && sr.results.length > 0);

  const prompt = `You are a PM + market analyst. Identify ${count} likely competitors or substitute solutions for this product.

APP NAME:
${appName}

APP DESCRIPTION:
${appDescription}

LANDING PAGE CONTENT:
${landingPageContent.substring(0, 2200)}

${webSearchContext}

Requirements:
- Include direct competitors and realistic substitutes users might choose instead
- Prefer established, recognizable tools where possible
- Keep claims conservative (no made-up hard numbers)
${usedWebSearch ? '- Use the web search results above to validate and enrich your analysis' : '- Use your training knowledge to identify competitors'}

Return ONLY valid JSON array:
[
  {
    "name": "Tool name",
    "url": "https://example.com",
    "positioning": "1 sentence",
    "strengths": ["...", "..."],
    "weaknesses": ["...", "..."],
    "pricing_model": "free|freemium|subscription|one-time|unknown",
    "confidence": "high|medium|low"
  }
]`;

  const text = await callLLM(prompt, 3000);
  return parseJsonArray<CompetitorProfile>(text, 'Failed to parse competitors from AI response');
}

/**
 * Generate app brief from GitHub repository (enhanced intelligence)
 */
export async function generateAppBriefFromRepo(repoUrl: string): Promise<GitHubAppBrief | null> {
  if (!isGitHubUrl(repoUrl)) {
    return null;
  }
  return generateAppBriefFromGitHub(repoUrl);
}

/**
 * Fetch GitHub repository information for context enrichment
 */
export async function fetchRepoContext(repoUrl: string) {
  if (!isGitHubUrl(repoUrl)) {
    return null;
  }
  return fetchGitHubRepoInfo(repoUrl);
}

export async function generateCompetitorComparison(
  appName: string,
  appDescription: string,
  competitors: CompetitorProfile[],
  personas: Persona[],
  sessions: SessionTrace[],
  interviews: ReflectionInterview[],
  jtbd: JTBDAnalysis
): Promise<string> {
  const prompt = `Create a concise competitor comparison report for ${appName}.

APP DESCRIPTION:
${appDescription}

COMPETITORS:
${JSON.stringify(competitors, null, 2)}

PERSONAS:
${JSON.stringify(personas, null, 2)}

SESSION SIGNALS:
${JSON.stringify(sessions, null, 2)}

INTERVIEW SIGNALS:
${JSON.stringify(interviews, null, 2)}

JTBD:
${JSON.stringify(jtbd, null, 2)}

Return markdown with:
1) "## Competitor Landscape" with a table: Competitor | Type (direct/substitute) | Why users choose it
2) "## Where ${appName} Wins" (3-5 bullets)
3) "## Where ${appName} Loses" (3-5 bullets)
4) "## Opportunity Gaps" (3-5 specific, testable opportunities)
5) "## Positioning Recommendation" (short paragraph)

Keep it practical and tied to the session/interview evidence.`;

  return callLLM(prompt, 4000);
}

export async function generateInsights(
  appName: string,
  personas: Persona[],
  sessions: SessionTrace[],
  interviews: ReflectionInterview[],
  jtbd: JTBDAnalysis,
  lighthouse: unknown,
  accessibility: unknown,
  extraContext?: Record<string, unknown>
): Promise<string> {
  const prompt = `Generate a comprehensive UX insights report for ${appName}.

DATA COLLECTED:

## Personas Tested (${personas.length}):
${JSON.stringify(personas, null, 2)}

## Session Traces:
${JSON.stringify(sessions, null, 2)}

## Post-Session Interviews:
${JSON.stringify(interviews, null, 2)}

## JTBD Analysis:
${JSON.stringify(jtbd, null, 2)}

## Lighthouse Scores:
${JSON.stringify(lighthouse, null, 2)}

## Accessibility:
${JSON.stringify(accessibility, null, 2)}

## Extra Context:
${JSON.stringify(extraContext || {}, null, 2)}

Generate a COMPREHENSIVE report with:

1. EXECUTIVE SUMMARY
   - Overall UX Health Score (0-100)
   - PMF Signal Strength
   - Top 3 critical issues
   - Top 3 quick wins

2. PERSONA INSIGHTS (for each persona)
   - Their experience summary
   - Key friction points they encountered
   - Their Sean Ellis score and what it means
   - Their specific recommendations

3. PMF SIGNALS
   - Disappointment Score (% very disappointed)
   - Aha Moment Rate
   - Segment with highest PMF probability
   - Who are the "desperate users"?

4. JTBD ANALYSIS
   - What job users are hiring this product for
   - Switching triggers and barriers
   - Competitor comparison

5. ISSUE CARDS (RICE prioritized)
   - Each issue with severity, frequency, persona affected
   - Evidence from sessions/interviews
   - Recommended fix

6. DECISION FRAMEWORK
   - If goal is GROWTH, do X
   - If goal is RETENTION, do Y
   - If goal is PMF, focus on Z

7. VALIDITY DISCLAIMER
   - What synthetic testing can/cannot assess
   - Confidence level
   - Validation recommendations

Format as Markdown with proper headers and tables.`;

  return callLLM(prompt, 8000);
}

/**
 * Vision-based annotation: for each screenshot, the LLM actually looks at the image
 * and identifies precise bounding box locations for each UX finding.
 * Falls back to text-only analysis if the screenshot file is missing.
 */
export async function generateFigmaAnnotations(
  appName: string,
  visualCaptures: VisualCapture[],
  highlights: StudyHighlight[]
): Promise<FigmaAnnotationBatch> {
  // Group highlights by best-matching screenshot
  const screenshotMap = new Map<string, { capture: VisualCapture; highlights: StudyHighlight[] }>();

  for (const highlight of highlights) {
    // Match highlight to the most relevant screenshot by URL/label
    const match = visualCaptures.find(c =>
      c.url === highlight.source ||
      c.label.toLowerCase().includes(highlight.source?.split('/').pop()?.toLowerCase() ?? '') ||
      highlight.source?.toLowerCase().includes(c.label.toLowerCase())
    ) ?? visualCaptures.find(c => c.label === 'landing') ?? visualCaptures[0];

    if (!match) continue;
    if (!screenshotMap.has(match.path)) {
      screenshotMap.set(match.path, { capture: match, highlights: [] });
    }
    screenshotMap.get(match.path)!.highlights.push(highlight);
  }

  const allAnnotations: FigmaAnnotationBatch['annotations'] = [];

  for (const [screenshotPath, { capture, highlights: screenHighlights }] of screenshotMap) {
    const fileExists = fs.existsSync(screenshotPath);

    if (fileExists) {
      // Vision path: send the actual screenshot to the LLM
      const imageBase64 = fs.readFileSync(screenshotPath).toString('base64');
      const findingsList = screenHighlights.map((h, i) =>
        `${i + 1}. ID: "${h.id}" | Type: ${h.type} | Severity: ${h.severity}\n   Title: "${h.title}"\n   Evidence: "${h.evidence}"`
      ).join('\n\n');

      const visionPrompt = `You are a UX annotation expert examining a real screenshot of "${appName}" — specifically the "${capture.label}" screen (URL: ${capture.url}).

Your job: for each UX finding below, identify the EXACT UI element or screen region being described, and return its bounding box as percentages of the screenshot dimensions.

UX FINDINGS ON THIS SCREEN:
${findingsList}

INSTRUCTIONS:
- Look at the actual screenshot carefully
- For each finding, pinpoint the specific button, form field, text block, nav item, image, or area the evidence refers to
- If the evidence describes a missing element (e.g. "no sign-up button visible"), mark the region where it SHOULD be
- Return x, y as the top-left corner; width and height as the size — all as 0–100 percentages
- Be precise: a CTA button should be ~5-15% wide, a hero section ~80% wide, a nav bar ~100% wide and ~8% tall

Return ONLY a valid JSON array, no explanation:
[
  {
    "id": "FINDING_ID",
    "rect_pct": { "x": 0, "y": 0, "width": 0, "height": 0 },
    "element_description": "brief description of the element you identified"
  }
]`;

      try {
        const raw = await callLLMWithImage(visionPrompt, imageBase64, 1500);
        const rects = parseJsonArray<{ id: string; rect_pct: FigmaAnnotationBatch['annotations'][0]['rect_pct']; element_description: string }>(
          raw, 'Failed to parse vision annotation rects'
        );

        for (const h of screenHighlights) {
          const rectData = rects.find(r => r.id === h.id);
          const rect = rectData?.rect_pct ?? fallbackRect(h.type);
          allAnnotations.push({
            id: `ann_${h.id}`,
            screenshot_path: screenshotPath,
            title: h.title,
            description: `[${h.persona_name}] ${h.evidence}`,
            severity: h.severity,
            color_token: severityToToken(h.severity),
            rect_pct: rect,
            linked_highlight_id: h.id,
            type: h.type,
            element_description: rectData?.element_description,
          });
        }
      } catch {
        // Vision call failed — fall back to text-only for this screenshot
        for (const h of screenHighlights) {
          allAnnotations.push(textOnlyAnnotation(h, screenshotPath));
        }
      }
    } else {
      // Screenshot missing — text-only annotation
      for (const h of screenHighlights) {
        allAnnotations.push(textOnlyAnnotation(h, screenshotPath));
      }
    }
  }

  return {
    generated_at: new Date().toISOString(),
    app_name: appName,
    instructions: [
      '1. Open the annotated_screenshots/ folder for visual overlays',
      '2. Each HTML file shows a screenshot with colored bounding boxes',
      '3. Hover over any box to read the full finding',
      '4. To import into Figma: use File > Place Image, then draw rectangles using rect_pct values',
      '5. Color key: red=critical, orange=high, yellow=medium, blue=low',
    ],
    annotations: allAnnotations,
  };
}

function severityToToken(severity: string): 'red' | 'orange' | 'yellow' | 'blue' {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'red';
    case 'high': return 'orange';
    case 'medium': return 'yellow';
    case 'low': return 'blue';
    default: return 'yellow';
  }
}

function fallbackRect(type: string): FigmaAnnotationBatch['annotations'][0]['rect_pct'] {
  switch (type) {
    case 'friction': return { x: 20, y: 30, width: 60, height: 15 };
    case 'aha':      return { x: 10, y: 60, width: 40, height: 20 };
    case 'quote':    return { x: 5,  y: 10, width: 30, height: 10 };
    default:         return { x: 25, y: 40, width: 50, height: 20 };
  }
}

function textOnlyAnnotation(h: StudyHighlight, screenshotPath: string): FigmaAnnotationBatch['annotations'][0] {
  return {
    id: `ann_${h.id}`,
    screenshot_path: screenshotPath,
    title: h.title,
    description: `[${h.persona_name}] ${h.evidence}`,
    severity: h.severity,
    color_token: severityToToken(h.severity),
    rect_pct: fallbackRect(h.type),
    linked_highlight_id: h.id,
    type: h.type,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 0: Pre-Testing Evaluation
// ═══════════════════════════════════════════════════════════════════════════

export async function evaluateHeuristics(
  pageUrl: string,
  pageContent: string,
  screenshotDescriptions: string[]
): Promise<HeuristicEvaluation> {
  const prompt = `You are a senior UX expert conducting a heuristic evaluation using Nielsen's 10 Heuristics and WCAG accessibility guidelines.

PAGE URL: ${pageUrl}

PAGE CONTENT (accessibility tree):
${pageContent.substring(0, 4000)}

SCREENSHOT CONTEXT:
${screenshotDescriptions.join('\n')}

Evaluate against these 10 heuristics:
1. Visibility of system status
2. Match between system and real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose, and recover from errors
10. Help and documentation

Also check for WCAG 2.1 AA violations.

For each violation found, generate a testable hypothesis for user testing.

Return ONLY valid JSON:
{
  "evaluator": "AI Heuristic Evaluator",
  "url": "${pageUrl}",
  "timestamp": "ISO_TIMESTAMP",
  "heuristics": [
    {
      "id": "h1",
      "name": "Visibility of system status",
      "violations": [
        {
          "element": "description of element",
          "description": "what's wrong",
          "severity": "critical|high|medium|low",
          "recommendation": "how to fix"
        }
      ],
      "score": 0-10
    }
  ],
  "wcag_violations": [
    {
      "criterion": "1.4.3",
      "level": "AA",
      "description": "Insufficient color contrast",
      "impact": "Users with low vision cannot read"
    }
  ],
  "hypothesis_list": [
    {
      "id": "hyp_1",
      "hypothesis": "Users will miss the submit button because...",
      "heuristic_source": "h1",
      "testable": true,
      "severity": "high"
    }
  ],
  "overall_score": 0-100
}`;

  const text = await callLLM(prompt, 6000);
  return parseJsonObject<HeuristicEvaluation>(text, 'Failed to parse heuristic evaluation');
}

export async function analyzeFirstClick(
  pages: Array<{ url: string; content: string; screenshot: string }>,
  tasks: string[]
): Promise<FirstClickAnalysis> {
  const prompt = `You are predicting where users will click first when trying to accomplish tasks. This measures "information scent" - how well the UI guides users to their goals.

PAGES:
${JSON.stringify(pages.map(p => ({ url: p.url, content: p.content.substring(0, 2000) })), null, 2)}

TASKS TO ANALYZE:
${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

For each page and task combination:
1. What element SHOULD users click to achieve the task?
2. What elements might they ACTUALLY click first? (predict top 3 with probabilities)
3. Would they hesitate? How long?
4. Is the "information scent" strong or weak?

Return ONLY valid JSON:
{
  "pages": [
    {
      "page": "Homepage",
      "url": "...",
      "screenshot": "...",
      "tasks": [
        {
          "goal": "Create an account",
          "expected_target": "Sign Up button in header",
          "first_click_predictions": [
            {"element": "Sign Up button", "probability": 0.65, "reasoning": "Most prominent CTA"},
            {"element": "Login link", "probability": 0.20, "reasoning": "Confusion between login/signup"},
            {"element": "Pricing link", "probability": 0.10, "reasoning": "Want to see cost first"}
          ],
          "correct_rate": 0.65,
          "avg_hesitation_ms": 2500
        }
      ]
    }
  ],
  "information_scent_score": 0-100,
  "navigation_clarity_score": 0-100
}`;

  const text = await callLLM(prompt, 5000);
  return parseJsonObject<FirstClickAnalysis>(text, 'Failed to parse first-click analysis');
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1: Intelligence Gathering
// ═══════════════════════════════════════════════════════════════════════════

export async function generateAppBrief(
  url: string,
  landingPageContent: string,
  navigationLinks: string[],
  screenshotDescriptions: string[]
): Promise<AppBrief> {
  const prompt = `Analyze this web application to create a comprehensive app brief for UX testing.

URL: ${url}

LANDING PAGE CONTENT:
${landingPageContent.substring(0, 3000)}

NAVIGATION LINKS DISCOVERED:
${navigationLinks.join('\n')}

VISUAL OBSERVATIONS:
${screenshotDescriptions.join('\n')}

Create a comprehensive app brief covering:
1. What is this product?
2. Who is it for?
3. What problem does it solve?
4. What are the key features?
5. How is it positioned competitively?

Return ONLY valid JSON:
{
  "app_name": "...",
  "url": "${url}",
  "tagline": "...",
  "value_proposition": "...",
  "target_audience": ["...", "..."],
  "problem_solved": "...",
  "features": [
    {
      "name": "...",
      "description": "...",
      "access_path": "/path",
      "requires_auth": true/false
    }
  ],
  "navigation_structure": {
    "primary_nav": ["...", "..."],
    "footer_links": ["...", "..."],
    "auth_flows": ["signup", "login", "sso"]
  },
  "integrations_detected": ["Google OAuth", "Stripe", "..."],
  "pricing_model": "free|freemium|subscription|enterprise|unknown",
  "competitive_positioning": "...",
  "key_differentiators": ["...", "..."]
}`;

  const text = await callLLM(prompt, 4000);
  return parseJsonObject<AppBrief>(text, 'Failed to parse app brief');
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2: Task & Severity Derivation
// ═══════════════════════════════════════════════════════════════════════════

export async function deriveTaskList(
  appBrief: AppBrief,
  personas: Persona[],
  jtbd: JTBDAnalysis
): Promise<TaskList> {
  const prompt = `Generate a prioritized task list for UX testing based on the app features, personas, and JTBD.

APP BRIEF:
${JSON.stringify(appBrief, null, 2)}

PERSONAS:
${JSON.stringify(personas, null, 2)}

JTBD:
${JSON.stringify(jtbd, null, 2)}

Requirements:
- Create tasks that test the core value proposition
- Include setup/onboarding tasks
- Include edge cases
- Match tasks to persona goals and technical literacy
- Define clear success criteria

Return ONLY valid JSON:
{
  "tasks": [
    {
      "task_id": "task_001",
      "task": "Sign up for a free account",
      "category": "setup",
      "priority": "must_test",
      "personas_applicable": ["maya_founder", "eric_skeptic"],
      "success_criteria": {
        "completion_indicator": "Account created, dashboard visible",
        "optimal_path_steps": 3,
        "max_acceptable_steps": 6,
        "time_expectation_seconds": 60
      },
      "potential_friction": ["email verification", "password requirements"]
    }
  ],
  "task_flow_recommended": ["task_001", "task_002", "task_003"]
}`;

  const text = await callLLM(prompt, 4000);
  return parseJsonObject<TaskList>(text, 'Failed to parse task list');
}

export async function classifyProblemSeverity(
  personas: Persona[],
  sessions: SessionTrace[],
  interviews: ReflectionInterview[]
): Promise<ProblemSeverityMatrix> {
  const prompt = `Classify each persona's problem severity based on their session behavior and interview responses.

Problem Severity Levels:
- Level 4 (Hair on fire): Desperately need solution, actively searching, budget allocated
- Level 3 (Painful): Clear pain, using workarounds, would prioritize solving
- Level 2 (Aware): Know the problem exists but tolerate current state
- Level 1 (Latent): Don't know they have the problem yet

PERSONAS:
${JSON.stringify(personas, null, 2)}

SESSION DATA:
${JSON.stringify(sessions, null, 2)}

INTERVIEW DATA:
${JSON.stringify(interviews, null, 2)}

Analyze signals like:
- Sean Ellis score
- Willingness to pay
- Current workarounds mentioned
- Urgency in language
- Return intent

Return ONLY valid JSON:
{
  "personas": [
    {
      "persona_id": "...",
      "severity_level": 1-4,
      "evidence": "Why this level...",
      "current_workarounds": ["...", "..."],
      "pain_intensity": 0-10,
      "willingness_to_pay_signal": "..."
    }
  ],
  "distribution": {
    "level_4_hair_on_fire": 0.2,
    "level_3_painful": 0.4,
    "level_2_aware": 0.3,
    "level_1_latent": 0.1
  },
  "pmf_readiness": "Ready for PMF push / Need to find hair-on-fire segment / Still exploring problem space"
}`;

  const text = await callLLM(prompt, 3000);
  return parseJsonObject<ProblemSeverityMatrix>(text, 'Failed to parse problem severity');
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3: Design Evaluation
// ═══════════════════════════════════════════════════════════════════════════

export async function generateDesignAudit(
  pageContent: string,
  accessibilityResults: unknown,
  screenshotDescriptions: string[]
): Promise<DesignAudit> {
  const prompt = `Conduct a comprehensive design audit evaluating visual design, accessibility, UI patterns, and responsiveness.

PAGE CONTENT:
${pageContent.substring(0, 3000)}

ACCESSIBILITY SCAN RESULTS:
${JSON.stringify(accessibilityResults, null, 2)}

VISUAL OBSERVATIONS:
${screenshotDescriptions.join('\n')}

Evaluate:
1. Visual Design: Hierarchy, whitespace, contrast, typography
2. Accessibility: WCAG compliance, keyboard navigation, screen reader
3. UI Patterns: Consistency, standard patterns, error handling
4. Responsive: Mobile/tablet/desktop adaptation

Return ONLY valid JSON:
{
  "overall_score": {
    "visual_design": 0-100,
    "accessibility": 0-100,
    "ui_patterns": 0-100,
    "responsive": 0-100,
    "total": 0-100
  },
  "accessibility_summary": {
    "violations_critical": 0,
    "violations_serious": 0,
    "violations_moderate": 0,
    "violations_minor": 0,
    "passes": 0
  },
  "findings": [
    {
      "category": "visual_design|accessibility|ui_patterns|responsive",
      "severity": "critical|major|minor|suggestion",
      "element": "...",
      "issue": "...",
      "impact": "...",
      "recommendation": "...",
      "wcag_criterion": "1.4.3"
    }
  ],
  "strengths": ["...", "..."],
  "improvement_priorities": [
    {
      "priority": 1,
      "area": "...",
      "reason": "...",
      "effort": "low|medium|high"
    }
  ]
}`;

  const text = await callLLM(prompt, 5000);
  return parseJsonObject<DesignAudit>(text, 'Failed to parse design audit');
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4: Analysis & Synthesis
// ═══════════════════════════════════════════════════════════════════════════

export async function performDualCoding(
  sessions: SessionTrace[],
  interviews: ReflectionInterview[]
): Promise<DualCodingResult> {
  const prompt = `Perform qualitative dual-coding analysis on the session and interview data. Simulate two independent coders analyzing the same data to ensure reliability.

SESSION DATA:
${JSON.stringify(sessions, null, 2)}

INTERVIEW DATA:
${JSON.stringify(interviews, null, 2)}

Process:
1. Coder 1: Extract themes from observations
2. Coder 2: Independently extract themes
3. Calculate inter-rater reliability (Cohen's Kappa)
4. Resolve disagreements through discussion
5. Report saturation (are new themes still emerging?)

Return ONLY valid JSON:
{
  "themes": [
    {
      "code": "onboarding_friction",
      "definition": "Difficulty during initial setup or first use",
      "frequency": 4,
      "examples": [
        {"source": "maya_session", "quote": "..."},
        {"source": "eric_interview", "quote": "..."}
      ],
      "coder_agreement": true
    }
  ],
  "cohens_kappa": 0.0-1.0,
  "reliability_rating": "excellent|good|moderate|fair|poor",
  "disagreements": [
    {
      "observation": "User paused for 5 seconds",
      "coder1_code": "confusion",
      "coder2_code": "reading",
      "resolution": "Classified as confusion based on follow-up action"
    }
  ],
  "saturation_reached": true/false
}`;

  const text = await callLLM(prompt, 5000);
  return parseJsonObject<DualCodingResult>(text, 'Failed to parse dual coding');
}

export async function generateSegmentHeatMap(
  personas: Persona[],
  problemSeverity: ProblemSeverityMatrix,
  sessions: SessionTrace[],
  interviews: ReflectionInterview[]
): Promise<SegmentHeatMap> {
  const prompt = `Create a segment heat map showing PMF probability by user segment.

PERSONAS:
${JSON.stringify(personas, null, 2)}

PROBLEM SEVERITY:
${JSON.stringify(problemSeverity, null, 2)}

SESSIONS:
${JSON.stringify(sessions, null, 2)}

INTERVIEWS:
${JSON.stringify(interviews, null, 2)}

Group personas into segments based on:
- Problem severity
- Current alternative satisfaction
- Willingness to switch

Calculate PMF probability score (0-100) for each segment.

Return ONLY valid JSON:
{
  "segments": [
    {
      "segment": "Busy Professionals",
      "personas": ["maya_founder", "david_pm"],
      "problem_severity": 4,
      "current_alternative_satisfaction": 2,
      "willingness_to_switch": 9,
      "pmf_probability_score": 85,
      "recommendation": "This is your beachhead market"
    }
  ],
  "desperate_users": {
    "segment": "...",
    "evidence": ["quote 1", "behavior signal"]
  },
  "best_pmf_opportunity": "Focus on X segment because..."
}`;

  const text = await callLLM(prompt, 4000);
  return parseJsonObject<SegmentHeatMap>(text, 'Failed to parse segment heat map');
}

export async function generateAnalysis(
  personas: Persona[],
  sessions: SessionTrace[],
  interviews: ReflectionInterview[],
  jtbd: JTBDAnalysis,
  problemSeverity: ProblemSeverityMatrix,
  dualCoding: DualCodingResult,
  designAudit: DesignAudit | null,
  competitors: CompetitorProfile[]
): Promise<AnalysisResult> {
  const prompt = `Generate comprehensive quantitative and qualitative analysis of all UX study data.

PERSONAS (${personas.length}):
${JSON.stringify(personas, null, 2)}

SESSIONS:
${JSON.stringify(sessions, null, 2)}

INTERVIEWS:
${JSON.stringify(interviews, null, 2)}

JTBD:
${JSON.stringify(jtbd, null, 2)}

PROBLEM SEVERITY:
${JSON.stringify(problemSeverity, null, 2)}

DUAL CODING:
${JSON.stringify(dualCoding, null, 2)}

DESIGN AUDIT:
${JSON.stringify(designAudit, null, 2)}

COMPETITORS:
${JSON.stringify(competitors, null, 2)}

Calculate:
1. SUS Score (System Usability Scale) proxy from session signals
2. HEART metrics (Happiness, Engagement, Adoption, Retention, Task success)
3. PMF signals (Disappointment score, Aha rate, Time to aha, Referral specificity)
4. Time-based metrics (TTFMA, hesitation, backtrack)
5. Qualitative themes with evidence
6. Prioritized issue inventory with RICE scores

Return ONLY valid JSON:
{
  "sus_score": 0-100,
  "sus_grade": "A|B|C|D|F",
  "heart_metrics": {
    "happiness": 0-100,
    "engagement": 0-100,
    "adoption": 0-100,
    "retention": 0-100,
    "task_success": 0-100
  },
  "pmf_signals": {
    "disappointment_score": 0-100,
    "aha_moment_rate": 0-100,
    "time_to_aha_avg_seconds": 0,
    "referral_specificity_rate": 0-100,
    "pmf_probability": 0-100
  },
  "time_metrics": {
    "avg_ttfma_seconds": 0,
    "hesitation_events_per_session": 0,
    "backtrack_rate": 0-1
  },
  "qualitative_themes": [
    {
      "theme": "...",
      "category": "navigation|onboarding|core_functionality|trust",
      "frequency": 0,
      "severity": "critical|high|medium|low",
      "evidence": ["...", "..."],
      "recommendation": "..."
    }
  ],
  "issue_inventory": [
    {
      "issue_id": "issue_001",
      "title": "...",
      "severity": "critical|high|medium|low",
      "frequency": 0,
      "personas_affected": ["...", "..."],
      "evidence_count": 0,
      "rice_score": 0
    }
  ],
  "insights_summary": {
    "top_strength": "...",
    "top_weakness": "...",
    "biggest_opportunity": "...",
    "biggest_risk": "...",
    "one_thing_to_fix": "..."
  }
}`;

  const text = await callLLM(prompt, 8000);
  return parseJsonObject<AnalysisResult>(text, 'Failed to parse analysis');
}

export async function generateCalibrationReport(
  sessions: SessionTrace[],
  interviews: ReflectionInterview[],
  analysisResult: AnalysisResult
): Promise<CalibrationReport> {
  const prompt = `Generate a calibration report that assesses the validity and reliability of this synthetic UX study.

SESSIONS:
${JSON.stringify(sessions, null, 2)}

INTERVIEWS:
${JSON.stringify(interviews, null, 2)}

ANALYSIS:
${JSON.stringify(analysisResult, null, 2)}

Assess:
1. Internal validity: Are findings consistent across personas?
2. Cross-synthetic reliability: Would different AI runs produce similar findings?
3. Human-synthetic correlation estimate: How well might this correlate with real user data?
4. Confidence levels for different finding types
5. What this study CAN and CANNOT tell us

Return ONLY valid JSON:
{
  "internal_validity": 0-100,
  "cross_synthetic_reliability": 0-100,
  "human_synthetic_correlation_estimate": 0-100,
  "confidence_by_finding_type": {
    "usability_issues": 0-100,
    "pmf_signals": 0-100,
    "quantitative_metrics": 0-100,
    "qualitative_themes": 0-100
  },
  "disclaimers": [
    "Synthetic users may not capture edge cases real users encounter",
    "..."
  ],
  "validation_recommendations": [
    "Validate top 3 findings with 5 real users",
    "..."
  ]
}`;

  const text = await callLLM(prompt, 3000);
  return parseJsonObject<CalibrationReport>(text, 'Failed to parse calibration report');
}

export async function generateABHypotheses(
  analysisResult: AnalysisResult,
  appBrief: AppBrief
): Promise<ABHypotheses> {
  const prompt = `Generate A/B test hypotheses based on UX study findings.

ANALYSIS:
${JSON.stringify(analysisResult, null, 2)}

APP BRIEF:
${JSON.stringify(appBrief, null, 2)}

For each high-priority issue, create a testable A/B hypothesis.

Return ONLY valid JSON:
{
  "hypotheses": [
    {
      "id": "ab_001",
      "issue_addressed": "issue_001",
      "hypothesis": "By changing X to Y, we expect Z",
      "control": "Current: ...",
      "variant": "Test: ...",
      "primary_metric": "Signup completion rate",
      "expected_lift": "+10-15%",
      "confidence": 0-100,
      "sample_size_estimate": "~1000 users per variant",
      "risk_level": "low|medium|high"
    }
  ],
  "prioritized_order": ["ab_001", "ab_002", "..."]
}`;

  const text = await callLLM(prompt, 4000);
  return parseJsonObject<ABHypotheses>(text, 'Failed to parse A/B hypotheses');
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5: Clip Extraction & Voice of User
// ═══════════════════════════════════════════════════════════════════════════

export async function extractClips(
  sessions: SessionTrace[],
  interviews: ReflectionInterview[],
  personas: Persona[],
  videoPath: string
): Promise<Clip[]> {
  const prompt = `Identify the most impactful moments from the user sessions that should be extracted as video clips for the clip library.

SESSIONS:
${JSON.stringify(sessions, null, 2)}

INTERVIEWS:
${JSON.stringify(interviews, null, 2)}

PERSONAS:
${JSON.stringify(personas, null, 2)}

VIDEO PATH: ${videoPath}

Extract clips for:
1. Friction moments (confusion, errors, abandonment)
2. Aha moments (value realization)
3. Delight moments (positive surprise)
4. Surprising behaviors (unexpected actions)
5. Powerful quotes from interviews

For each clip, provide:
- Start/end timestamps
- One-sentence summary
- Transcript segment
- Tags for searchability
- Linked issue (if applicable)

Return ONLY valid JSON array:
[
  {
    "clip_id": "clip_001",
    "source_session": "maya_founder",
    "video_path": "${videoPath}",
    "duration_seconds": 12,
    "start_timestamp_ms": 45000,
    "end_timestamp_ms": 57000,
    "one_sentence_summary": "Maya repeatedly clicks wrong button looking for signup",
    "transcript_segment": [
      {"t": "00:45", "text": "Hmm, where do I create an account?"},
      {"t": "00:48", "text": "Let me try this... no that's login"}
    ],
    "tags": ["friction", "onboarding", "navigation"],
    "persona": {
      "id": "maya_founder",
      "segment": "busy_professionals",
      "problem_severity": 4
    },
    "clip_type": "friction",
    "linked_issue": "issue_001"
  }
]`;

  const text = await callLLM(prompt, 6000);
  return parseJsonArray<Clip>(text, 'Failed to parse clips');
}

export async function buildClipLibrary(
  clips: Clip[],
  sessions: SessionTrace[]
): Promise<ClipLibrary> {
  const totalDuration = clips.reduce((sum, c) => sum + c.duration_seconds, 0);
  
  const bySeverity: Record<string, string[]> = {};
  const byFeature: Record<string, string[]> = {};
  const byMomentType: Record<string, string[]> = {};
  const byPersona: Record<string, string[]> = {};

  for (const clip of clips) {
    // By severity (derived from linked issue or clip type)
    const severity = clip.clip_type === 'friction' ? 'high' : 'medium';
    if (!bySeverity[severity]) bySeverity[severity] = [];
    bySeverity[severity].push(clip.clip_id);

    // By moment type
    if (!byMomentType[clip.clip_type]) byMomentType[clip.clip_type] = [];
    byMomentType[clip.clip_type].push(clip.clip_id);

    // By persona
    if (!byPersona[clip.persona.id]) byPersona[clip.persona.id] = [];
    byPersona[clip.persona.id].push(clip.clip_id);

    // By feature (from tags)
    for (const tag of clip.tags) {
      if (!byFeature[tag]) byFeature[tag] = [];
      byFeature[tag].push(clip.clip_id);
    }
  }

  return {
    total_clips: clips.length,
    total_duration_minutes: Math.round(totalDuration / 60),
    sessions_analyzed: sessions.length,
    clips,
    by_severity: bySeverity,
    by_feature: byFeature,
    by_moment_type: byMomentType,
    by_persona: byPersona,
  };
}

export async function generateWeeklyDigest(
  clipLibrary: ClipLibrary,
  analysisResult: AnalysisResult,
  weekLabel: string
): Promise<WeeklyDigest> {
  const prompt = `Generate a weekly Voice of User digest from the clip library and analysis.

CLIP LIBRARY:
${JSON.stringify(clipLibrary, null, 2)}

ANALYSIS:
${JSON.stringify(analysisResult, null, 2)}

WEEK: ${weekLabel}

Select the most impactful clips for:
1. THE WIN: Best moment of user delight or value realization
2. THE PAIN: Most painful friction point captured
3. THE SURPRISE: Most unexpected user behavior or feedback

Provide metrics snapshot and one clear action item.

Return ONLY valid JSON:
{
  "week": "${weekLabel}",
  "generated_at": "ISO_TIMESTAMP",
  "the_win": {
    "clip_id": "...",
    "summary": "...",
    "duration_seconds": 0,
    "why_it_matters": "..."
  },
  "the_pain": {
    "clip_id": "...",
    "summary": "...",
    "duration_seconds": 0,
    "why_it_matters": "..."
  },
  "the_surprise": {
    "clip_id": "...",
    "summary": "...",
    "duration_seconds": 0,
    "contradicts_assumption": "We assumed X but users actually Y"
  },
  "metrics_snapshot": {
    "disappointment_score": 0,
    "disappointment_trend": "↑|↓|→",
    "aha_moment_rate": 0,
    "top_friction_point": "..."
  },
  "one_thing_to_fix": {
    "issue": "...",
    "expected_impact": "...",
    "linked_clip": "..."
  }
}`;

  const text = await callLLM(prompt, 3000);
  return parseJsonObject<WeeklyDigest>(text, 'Failed to parse weekly digest');
}

// ═══════════════════════════════════════════════════════════════════════════
// Session Enhancement: Time-Based Metrics
// ═══════════════════════════════════════════════════════════════════════════

export async function analyzeTimeMetrics(
  session: SessionTrace,
  optimalSteps: number
): Promise<TimeBasedMetrics> {
  const actions = session.actions;
  
  // TTFMA: Time to first meaningful action (not just page load)
  const meaningfulActions = ['click', 'fill', 'submit', 'select'];
  const firstMeaningful = actions.find(a => 
    meaningfulActions.some(ma => a.action.toLowerCase().includes(ma))
  );
  const ttfma = firstMeaningful ? firstMeaningful.timestamp / 1000 : 0;

  // Hesitation events: gaps > 3 seconds between actions
  const hesitationEvents: TimeBasedMetrics['hesitation_events'] = [];
  for (let i = 1; i < actions.length; i++) {
    const gap = actions[i].timestamp - actions[i - 1].timestamp;
    if (gap > 3000) {
      hesitationEvents.push({
        timestamp_ms: actions[i - 1].timestamp,
        duration_ms: gap,
        context: actions[i - 1].narration,
      });
    }
  }

  // Backtrack events: navigation reversals or going "back"
  const backtrackEvents: TimeBasedMetrics['backtrack_events'] = [];
  const navigationHistory: string[] = [];
  for (const action of actions) {
    if (action.action === 'navigate' || action.action === 'click') {
      const target = action.element || action.action;
      if (target.includes('back') || target.includes('previous') || 
          navigationHistory.slice(-3).includes(target)) {
        backtrackEvents.push({
          timestamp_ms: action.timestamp,
          from_url: navigationHistory[navigationHistory.length - 1] || 'unknown',
          to_url: target,
        });
      }
      navigationHistory.push(target);
    }
  }

  const totalTime = actions.length > 0 
    ? (actions[actions.length - 1].timestamp - actions[0].timestamp) / 1000 
    : 0;
  const stepsCount = actions.length;
  const efficiencyScore = optimalSteps > 0 
    ? Math.min(100, Math.round((optimalSteps / stepsCount) * 100)) 
    : 100;

  return {
    ttfma_seconds: ttfma,
    hesitation_events: hesitationEvents,
    backtrack_events: backtrackEvents,
    total_time_seconds: totalTime,
    steps_count: stepsCount,
    optimal_steps: optimalSteps,
    efficiency_score: efficiencyScore,
  };
}
