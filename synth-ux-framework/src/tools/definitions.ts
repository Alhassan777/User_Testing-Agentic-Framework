import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const TOOLS: Tool[] = [
  {
    name: 'synth_ux_full_test',
    description: `Run a comprehensive synthetic UX test on a web application. 
This orchestrates multiple agents: Heuristic Evaluation, Persona Generation, 
Session Simulation, and Report Generation. Returns detailed instructions for 
conducting the test using browser MCP tools.`,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL of the application to test' },
        credentials: {
          type: 'object',
          properties: { email: { type: 'string' }, password: { type: 'string' } },
          description: 'Optional login credentials',
        },
        focus: {
          type: 'string',
          enum: ['full', 'signup', 'onboarding', 'core-feature'],
          description: 'Which flow to focus on (default: full)',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'heuristic_evaluate',
    description: `Evaluate a web application against Nielsen's 10 Usability Heuristics 
and WCAG 2.1 AA accessibility guidelines. Generates testable hypotheses.`,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to evaluate' },
        pages: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific pages to evaluate (optional, auto-discovers if not provided)',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'persona_generate',
    description: `Generate diverse synthetic user personas for testing. 
Uses 16-dimension persona model with diversity enforcement rules.`,
    inputSchema: {
      type: 'object',
      properties: {
        app_context: { type: 'string', description: 'Brief description of the app being tested' },
        count: { type: 'number', description: 'Number of personas to generate (default: 5)' },
        constraints: {
          type: 'string',
          description: 'Optional constraints like "3 ICP + 2 adjacent + 1 adversarial"',
        },
      },
      required: ['app_context'],
    },
  },
  {
    name: 'session_simulate',
    description: `Simulate a user session as a specific persona. 
Includes think-aloud narration, friction detection, and aha moment tracking.`,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to navigate to' },
        persona: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            technical_literacy: { type: 'string' },
            patience_level: { type: 'string' },
            goal: { type: 'string' },
          },
          required: ['name', 'description'],
          description: 'Persona to simulate',
        },
        tasks: { type: 'array', items: { type: 'string' }, description: 'Tasks the persona should attempt' },
        credentials: {
          type: 'object',
          properties: { email: { type: 'string' }, password: { type: 'string' } },
        },
      },
      required: ['url', 'persona'],
    },
  },
  {
    name: 'jtbd_analyze',
    description: `Analyze the Jobs-to-Be-Done that users hire the product for. 
Maps switching triggers, anxieties, and costs.`,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL of the landing page to analyze' },
        app_description: { type: 'string', description: 'Brief description of what the app does' },
      },
      required: ['url'],
    },
  },
  {
    name: 'problem_severity_classify',
    description: `Classify personas by problem severity level (Hair on Fire → Latent). 
Identifies which segments have highest PMF potential.`,
    inputSchema: {
      type: 'object',
      properties: {
        personas: {
          type: 'array',
          items: { type: 'object', properties: { id: { type: 'string' }, description: { type: 'string' } } },
          description: 'Personas to classify',
        },
        problem_statement: { type: 'string', description: 'The problem the app solves' },
      },
      required: ['personas', 'problem_statement'],
    },
  },
  {
    name: 'reflection_interview',
    description: `Conduct a 12-question post-session interview including the Sean Ellis 
disappointment question and PMF signals.`,
    inputSchema: {
      type: 'object',
      properties: {
        session_summary: { type: 'string', description: 'Summary of the session that was just completed' },
        persona: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } },
      },
      required: ['session_summary', 'persona'],
    },
  },
  {
    name: 'report_generate',
    description: `Generate a comprehensive UX report with RICE-prioritized recommendations, 
decision framework, and validity disclaimers.`,
    inputSchema: {
      type: 'object',
      properties: {
        findings: { type: 'object', description: 'All findings from previous phases' },
        app_name: { type: 'string', description: 'Name of the app tested' },
      },
      required: ['findings', 'app_name'],
    },
  },
  {
    name: 'segment_heat_map',
    description: `Analyze which user segments show the strongest PMF signals. 
Identifies your "desperate users" - the 10 who would be devastated without your product.`,
    inputSchema: {
      type: 'object',
      properties: {
        personas: { type: 'array', items: { type: 'object' }, description: 'Personas with their session results' },
        problem_statement: { type: 'string', description: 'The core problem the product solves' },
      },
      required: ['personas', 'problem_statement'],
    },
  },
  {
    name: 'voice_of_user_digest',
    description: `Generate a weekly "Voice of User" digest with the Win, the Pain, 
and the Surprise from recent sessions.`,
    inputSchema: {
      type: 'object',
      properties: {
        sessions: { type: 'array', items: { type: 'object' }, description: 'Recent session traces' },
        week_of: { type: 'string', description: 'Week identifier (e.g., "2026-W12")' },
      },
      required: ['sessions'],
    },
  },
  {
    name: 'list_agents',
    description: `List all available agent definitions and their purposes.`,
    inputSchema: { type: 'object', properties: {} },
  },
  // ========== VIDEO RECORDING TOOLS ==========
  {
    name: 'video_start_recording',
    description: `Start recording a browser session video using Playwright. 
Returns a session ID to use for stopping the recording later.`,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to navigate to and start recording' },
        session_name: { type: 'string', description: 'Name for this recording session (used in filename)' },
      },
      required: ['url', 'session_name'],
    },
  },
  {
    name: 'video_stop_recording',
    description: `Stop an active video recording session and save the video file.`,
    inputSchema: {
      type: 'object',
      properties: { session_id: { type: 'string', description: 'Session ID returned from video_start_recording' } },
      required: ['session_id'],
    },
  },
  {
    name: 'video_list_recordings',
    description: `List all recorded video files.`,
    inputSchema: { type: 'object', properties: {} },
  },
  // ========== ACCESSIBILITY TOOLS ==========
  {
    name: 'accessibility_scan',
    description: `Run automated WCAG accessibility scan on a URL using axe-core. 
Returns violations, passes, and recommendations.`,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to scan for accessibility issues' },
        standard: {
          type: 'string',
          enum: ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa'],
          description: 'WCAG standard to test against (default: wcag21aa)',
        },
      },
      required: ['url'],
    },
  },
  // ========== PERFORMANCE TOOLS ==========
  {
    name: 'lighthouse_audit',
    description: `Run a Lighthouse performance audit on a URL. 
Returns Core Web Vitals, performance score, and recommendations.`,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to audit' },
        categories: {
          type: 'array',
          items: { type: 'string', enum: ['performance', 'accessibility', 'best-practices', 'seo'] },
          description: 'Categories to audit (default: all)',
        },
      },
      required: ['url'],
    },
  },
  // ========== AUTONOMOUS TEST ==========
  {
    name: 'run_autonomous_ux_test',
    description: `Run a FULLY AUTONOMOUS UX test that executes everything using Playwright.
This tool actually navigates the app, takes screenshots, records video, runs accessibility 
and performance audits, and generates a complete report. No manual browser interaction needed.`,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL of the application to test' },
        credentials: {
          type: 'object',
          properties: { email: { type: 'string' }, password: { type: 'string' } },
          description: 'Optional login credentials',
        },
        test_duration_minutes: { type: 'number', description: 'How long to explore the app (default: 5 minutes)' },
        pages_to_test: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific pages/routes to test (optional, auto-discovers if not provided)',
        },
      },
      required: ['url'],
    },
  },
  // ========== FULL AI-POWERED STUDY ==========
  {
    name: 'run_full_ux_study',
    description: `Run a COMPLETE AI-powered UX study with personas, simulated sessions, 
interviews, JTBD analysis, and comprehensive insights. This actually EXECUTES everything:
- Generates 5 diverse personas
- Simulates each persona testing the app
- Conducts post-session interviews (including Sean Ellis question)
- Analyzes Jobs-to-Be-Done
- Runs Lighthouse and accessibility audits
- Generates comprehensive report with PMF signals

REQUIRES: GEMINI_API_KEY or ANTHROPIC_API_KEY in environment. Get Gemini key: https://aistudio.google.com/apikey`,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL of the application to test' },
        app_name: { type: 'string', description: 'Name of the application' },
        app_description: { type: 'string', description: 'Brief description of what the app does' },
        credentials: {
          type: 'object',
          properties: { email: { type: 'string' }, password: { type: 'string' } },
          description: 'Optional login credentials',
        },
        persona_count: { type: 'number', description: 'Number of personas to generate (default: 5)' },
        pages_to_test: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific pages to test (optional)',
        },
      },
      required: ['url', 'app_name', 'app_description'],
    },
  },
  // ========== GITHUB REPO ANALYSIS ==========
  {
    name: 'analyze_github_repo',
    description: `Analyze a GitHub repository to generate an app brief for UX testing.
Crawls README, package.json, and code structure to understand:
- What the app does
- Tech stack used
- Main features
- Target users
- Setup complexity
- Competitor hints

OPTIONAL: Set GITHUB_TOKEN in environment for higher rate limits.`,
    inputSchema: {
      type: 'object',
      properties: {
        repo_url: {
          type: 'string',
          description: 'GitHub repository URL (e.g., https://github.com/owner/repo)',
        },
      },
      required: ['repo_url'],
    },
  },
  // ========== WEB SEARCH FOR COMPETITORS ==========
  {
    name: 'search_competitors',
    description: `Search the web for competitors of a given product.
Uses Tavily (if TAVILY_API_KEY is set; free tier: 1000 searches/month) or falls back to AI inference.

Returns search results from queries like:
- "[app name] alternatives"
- "[app name] competitors"
- "best [category] tools"
- "[app name] vs"`,
    inputSchema: {
      type: 'object',
      properties: {
        app_name: { type: 'string', description: 'Name of the application' },
        app_description: { type: 'string', description: 'Brief description of what the app does' },
      },
      required: ['app_name', 'app_description'],
    },
  },
  // ========== ANNOTATED SCREENSHOTS ==========
  {
    name: 'generate_annotated_screenshots',
    description: `Generate visual HTML screenshots with UX finding overlays from a completed study.
Takes the figma_annotations.json and screenshots from a study directory and produces:
- annotated_screenshots/*.html files with interactive overlays
- figma_plugin_import.json for Figma import
- Color-coded severity boxes (critical=red, high=orange, medium=yellow, low=blue)
- Hover tooltips showing finding details

Use this after run_full_ux_study to visualize findings on screenshots.`,
    inputSchema: {
      type: 'object',
      properties: {
        study_dir: {
          type: 'string',
          description: 'Path to the study directory (e.g., output/studies/study_123456789)',
        },
        study_id: {
          type: 'string',
          description: 'Study ID (alternative to study_dir - will look in default output location)',
        },
      },
      required: [],
    },
  },
  // ========== EXPORT ANNOTATIONS ==========
  {
    name: 'export_annotations',
    description: `Export UX findings as PNG images, JSON, and/or Markdown from a completed study.
Generates:
- **PNG**: Annotated screenshots with color-coded severity boxes and numbered labels baked into the image
- **JSON**: Machine-readable findings with metadata, severity counts, and locations
- **Markdown**: Human-readable report with emoji severity indicators and embedded images

Output goes to: study_directory/exports/`,
    inputSchema: {
      type: 'object',
      properties: {
        study_dir: {
          type: 'string',
          description: 'Path to the study directory',
        },
        study_id: {
          type: 'string',
          description: 'Study ID (alternative to study_dir)',
        },
        formats: {
          type: 'array',
          items: { type: 'string', enum: ['png', 'json', 'markdown'] },
          description: 'Export formats (default: all three)',
        },
      },
      required: [],
    },
  },
];
