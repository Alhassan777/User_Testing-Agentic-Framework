export type Phase =
  | 'init'
  | 'pre_testing'
  | 'intelligence'
  | 'derivation'
  | 'execution'
  | 'analysis'
  | 'clips'
  | 'output'
  | 'complete'
  | 'error'
  | 'recovery';

export interface OrchestratorConfig {
  url: string;
  appName: string;
  appDescription: string;
  repoUrl?: string;
  credentials?: {
    email: string;
    password: string;
  };
  personaCount: number;
  studyDir: string;
  enableVideo: boolean;
  enableLighthouse: boolean;
  enableAccessibility: boolean;
}

export interface BrowserSession {
  sessionId: string;
  personaId: string;
  tabId?: string;
  videoPath?: string;
  transcript: TranscriptEntry[];
  isLocked: boolean;
  startedAt: Date;
}

export interface TranscriptEntry {
  timestampMs: number;
  timestampDisplay: string;
  narration: string;
  action: string;
  target?: string;
  uxFlag?: string;
  severity?: string;
}

export interface Resource {
  type: 'browser_tab' | 'video_recording' | 'browser_context';
  id: string;
  failed?: boolean;
}

export interface ArtifactPipeline {
  // Phase 0
  hypothesisList: HypothesisList | null;
  informationScent: InformationScentReport | null;
  
  // Phase 1
  appBrief: AppBrief | null;
  competitors: CompetitorProfile[] | null;
  personas: Persona[] | null;
  jtbd: JTBDAnalysis | null;
  
  // Phase 2
  taskList: TaskList | null;
  problemSeverity: ProblemSeverityMatrix | null;
  
  // Phase 3
  sessions: SessionResult[] | null;
  competitorTraces: CompetitorTrace[] | null;
  designAudit: DesignAudit | null;
  
  // Phase 4
  reflections: ReflectionInterview[] | null;
  codedObservations: CodingResult | null;
  analysis: Analysis | null;
  segments: SegmentHeatMap | null;
  
  // Phase 5
  clips: Clip[] | null;
  
  // Output
  report: Report | null;
  calibration: CalibrationReport | null;
  abHypotheses: ABHypotheses | null;
  weeklyDigest: WeeklyDigest | null;
}

export interface HypothesisList {
  hypotheses: Array<{
    id: string;
    heuristic: string;
    hypothesis: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    testable: boolean;
  }>;
}

export interface InformationScentReport {
  pages: Array<{
    page: string;
    url: string;
    screenshot: string;
    clickTargets: Array<{
      goal: string;
      expectedClick: string;
      actualClicks: string[];
      correctRate: number;
    }>;
  }>;
}

export interface AppBrief {
  appName: string;
  url: string;
  tagline: string;
  valueProposition: string;
  targetAudience: string[];
  problemSolved: string;
  features: Array<{
    name: string;
    description: string;
    accessPath: string;
    requiresAuth: boolean;
  }>;
  navigationStructure: {
    primaryNav: string[];
    footerLinks: string[];
    authFlows: string[];
  };
  integrationsDetected: string[];
  pricingModel: string;
  techStack?: {
    frontend: string;
    backend: string;
    database: string;
  };
}

export interface CompetitorProfile {
  name: string;
  url: string;
  type: 'direct' | 'indirect' | 'substitute';
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  pricingModel: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface Persona {
  id: string;
  name: string;
  age: number;
  role: string;
  technicalLiteracy: 'high' | 'medium' | 'low';
  patienceLevel: 'high' | 'medium' | 'low';
  goals: string[];
  frustrations: string[];
  context: string;
  problemSeverity: 1 | 2 | 3 | 4;
  // Extended 16 dimensions
  priorDomainKnowledge?: 'novice' | 'intermediate' | 'expert';
  motivationQuality?: 'want_to' | 'have_to' | 'told_to';
  decisionAuthority?: 'individual' | 'team_buyer' | 'enterprise_evaluator';
  riskTolerance?: 'adventurous' | 'moderate' | 'conservative';
  attentionMode?: 'focused' | 'distracted' | 'interrupted';
  accessibilityNeeds?: string[];
}

export interface JTBDAnalysis {
  functionalJob: string;
  emotionalJob: string;
  socialJob: string;
  currentSolutions: string[];
  switchingTriggers: string[];
  switchingAnxieties: string[];
  hiringCriteria: {
    mustHave: string[];
    niceToHave: string[];
    dealbreakers: string[];
  };
}

export interface TaskList {
  tasks: Array<{
    taskId: string;
    task: string;
    category: 'core' | 'setup' | 'edge' | 'advanced';
    priority: 'must_test' | 'should_test' | 'nice_to_have';
    personasApplicable: string[];
    successCriteria: {
      completionIndicator: string;
      optimalPathSteps: number;
      maxAcceptableSteps: number;
      timeExpectationSeconds: number;
    };
  }>;
  taskFlowRecommended: string[];
}

export interface ProblemSeverityMatrix {
  personas: Array<{
    personaId: string;
    severityLevel: 1 | 2 | 3 | 4;
    evidence: string;
    currentWorkarounds: string[];
    painIntensity: number;
  }>;
}

export interface SessionResult {
  personaId: string;
  personaName: string;
  trace: SessionTrace;
  ahaAnalysis: AhaAnalysis;
  videoPath?: string;
  transcript: TranscriptEntry[];
}

export interface SessionTrace {
  personaId: string;
  actions: Array<{
    timestampMs: number;
    action: string;
    element?: string;
    narration: string;
    uxFlag?: string;
    severity?: string;
  }>;
  ahaMoment?: {
    occurred: boolean;
    trigger?: string;
    timeSeconds?: number;
    quote?: string;
  };
  frictionPoints: string[];
  delightMoments: string[];
  metrics: TimeBasedMetrics;
}

export interface TimeBasedMetrics {
  ttfmaSeconds: number; // Time to first meaningful action
  hesitationEvents: number; // Pauses >3s
  backtrackCount: number; // Navigation reversals
  totalTimeSeconds: number;
  stepsCount: number;
  optimalSteps: number;
}

export interface AhaAnalysis {
  occurred: boolean;
  trigger?: string;
  timeToAhaSeconds?: number;
  quote?: string;
  intensityScore?: number;
}

export interface CompetitorTrace {
  competitorName: string;
  competitorUrl: string;
  taskId: string;
  personaId: string;
  metrics: {
    completed: boolean;
    completionTimeSeconds: number;
    stepsTaken: number;
    errorCount: number;
  };
  actions: Array<{
    timestampMs: number;
    action: string;
    narration: string;
  }>;
}

export interface DesignAudit {
  overallScore: {
    visualDesign: number;
    accessibility: number;
    uiPatterns: number;
    responsive: number;
    total: number;
  };
  accessibilitySummary: {
    violationsCritical: number;
    violationsSerious: number;
    violationsModerate: number;
    violationsMinor: number;
    passes: number;
  };
  findings: Array<{
    category: string;
    severity: string;
    element: string;
    issue: string;
    recommendation: string;
  }>;
}

export interface ReflectionInterview {
  personaId: string;
  personaName: string;
  questions: Array<{
    question: string;
    answer: string;
    insight?: string;
  }>;
  seanEllisScore: 'very_disappointed' | 'somewhat_disappointed' | 'not_disappointed';
  wouldReturn: boolean;
  referralSpecificity: string;
  willingnessToPay: string;
}

export interface CodingResult {
  themes: Array<{
    code: string;
    frequency: number;
    examples: string[];
  }>;
  interRaterReliability: number; // Cohen's Kappa
}

export interface Analysis {
  susScore: number;
  heartMetrics: {
    happiness: number;
    engagement: number;
    adoption: number;
    retention: number;
    taskSuccess: number;
  };
  pmfSignals: {
    disappointmentScore: number;
    ahaMomentRate: number;
    timeToAhaAvgSeconds: number;
    referralSpecificityRate: number;
    pmfProbability: number;
  };
  qualitativeThemes: Array<{
    theme: string;
    frequency: number;
    severity: string;
    evidence: string[];
  }>;
  issueInventory: Array<{
    issueId: string;
    title: string;
    severity: string;
    frequency: number;
    personasAffected: string[];
  }>;
}

export interface SegmentHeatMap {
  segments: Array<{
    segment: string;
    personas: string[];
    problemSeverity: number;
    currentAlternativeSatisfaction: number;
    willingnessToSwitch: number;
    pmfProbabilityScore: number;
    recommendation: string;
  }>;
}

export interface Clip {
  clipId: string;
  sourceSession: string;
  videoPath: string;
  thumbnailPath?: string;
  durationSeconds: number;
  startTimestampMs: number;
  endTimestampMs: number;
  oneSentenceSummary: string;
  transcriptSegment: Array<{
    t: string;
    text: string;
  }>;
  tags: string[];
  persona: {
    id: string;
    segment: string;
    problemSeverity: number;
  };
  linkedIssue?: string;
}

export interface Report {
  executiveSummary: {
    uxHealthScore: number;
    pmfSignalStrength: string;
    criticalIssues: number;
    quickWins: number;
  };
  decisionFramework: {
    forActivation: string;
    forPmf: string;
    forRetention: string;
    oneQuestion: string;
  };
  issueCards: Array<{
    issueId: string;
    title: string;
    severity: string;
    riceScore: number;
    videoEvidence: string[];
    recommendation: string;
  }>;
}

export interface CalibrationReport {
  internalValidity: number;
  crossSyntheticReliability: number;
  humanSyntheticCorrelation: number;
  disclaimers: string[];
}

export interface ABHypotheses {
  hypotheses: Array<{
    id: string;
    issueAddressed: string;
    hypothesis: string;
    primaryMetric: string;
    expectedLift: string;
    confidence: number;
  }>;
}

export interface WeeklyDigest {
  week: string;
  generatedAt: string;
  theWin: {
    clipId: string;
    summary: string;
    whyItMatters: string;
  };
  thePain: {
    clipId: string;
    summary: string;
    whyItMatters: string;
  };
  theSurprise: {
    clipId: string;
    summary: string;
    contradictsAssumption: string;
  };
  metricsSnapshot: {
    disappointmentScore: number;
    ahaMomentRate: number;
    topFrictionPoint: string;
  };
  oneThingToFix: {
    issue: string;
    expectedImpact: string;
    linkedClip: string;
  };
}
