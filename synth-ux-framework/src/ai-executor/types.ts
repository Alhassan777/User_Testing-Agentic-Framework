export type LLMProvider = 'gemini' | 'anthropic';

export interface Persona {
  id: string;
  name: string;
  age: number;
  role: string;
  technical_literacy: 'high' | 'medium' | 'low';
  patience_level: 'high' | 'medium' | 'low';
  goals: string[];
  frustrations: string[];
  context: string;
  problem_severity: 1 | 2 | 3 | 4;
}

export interface SessionTrace {
  persona_id: string;
  actions: Array<{
    timestamp: number;
    action: string;
    element?: string;
    narration: string;
    ux_flag?: string;
    severity?: string;
  }>;
  aha_moment?: {
    occurred: boolean;
    trigger?: string;
    time_seconds?: number;
    quote?: string;
  };
  friction_points: string[];
  delight_moments: string[];
}

export interface ReflectionInterview {
  persona_id: string;
  persona_name: string;
  questions: Array<{
    question: string;
    answer: string;
    insight?: string;
  }>;
  sean_ellis_score: 'very_disappointed' | 'somewhat_disappointed' | 'not_disappointed';
  would_return: boolean;
  referral_specificity: string;
  willingness_to_pay: string;
}

export interface JTBDAnalysis {
  functional_job: string;
  emotional_job: string;
  social_job: string;
  current_solutions: string[];
  switching_triggers: string[];
  switching_anxieties: string[];
  hiring_criteria: {
    must_have: string[];
    nice_to_have: string[];
    dealbreakers: string[];
  };
}

export interface CompetitorProfile {
  name: string;
  url: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  pricing_model: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface StudyHighlight {
  id: string;
  persona_id: string;
  persona_name: string;
  type: 'friction' | 'aha' | 'quote';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  evidence: string;
  source: string;
  screenshot: string;
}

export interface VisualCapture {
  label: string;
  url: string;
  path: string;
}

export interface FigmaAnnotation {
  id: string;
  screenshot_path: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  color_token: 'red' | 'orange' | 'yellow' | 'blue';
  rect_pct: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  linked_highlight_id?: string;
  /** friction | aha | quote */
  type?: string;
  /** Human-readable description of the UI element the LLM identified in the screenshot */
  element_description?: string;
}

export interface FigmaAnnotationBatch {
  generated_at: string;
  app_name: string;
  instructions: string[];
  annotations: FigmaAnnotation[];
}

export interface HeuristicEvaluation {
  evaluator: string;
  url: string;
  timestamp: string;
  heuristics: Array<{
    id: string;
    name: string;
    violations: Array<{
      element: string;
      description: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      recommendation: string;
    }>;
    score: number;
  }>;
  wcag_violations: Array<{
    criterion: string;
    level: 'A' | 'AA' | 'AAA';
    description: string;
    impact: string;
  }>;
  hypothesis_list: Array<{
    id: string;
    hypothesis: string;
    heuristic_source: string;
    testable: boolean;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }>;
  overall_score: number;
}

export interface FirstClickAnalysis {
  pages: Array<{
    page: string;
    url: string;
    screenshot: string;
    tasks: Array<{
      goal: string;
      expected_target: string;
      first_click_predictions: Array<{
        element: string;
        probability: number;
        reasoning: string;
      }>;
      correct_rate: number;
      avg_hesitation_ms: number;
    }>;
  }>;
  information_scent_score: number;
  navigation_clarity_score: number;
}

export interface AppBrief {
  app_name: string;
  url: string;
  tagline: string;
  value_proposition: string;
  target_audience: string[];
  problem_solved: string;
  features: Array<{
    name: string;
    description: string;
    access_path: string;
    requires_auth: boolean;
  }>;
  navigation_structure: {
    primary_nav: string[];
    footer_links: string[];
    auth_flows: string[];
  };
  integrations_detected: string[];
  pricing_model: string;
  competitive_positioning: string;
  key_differentiators: string[];
}

export interface TaskList {
  tasks: Array<{
    task_id: string;
    task: string;
    category: 'core' | 'setup' | 'edge' | 'advanced';
    priority: 'must_test' | 'should_test' | 'nice_to_have';
    personas_applicable: string[];
    success_criteria: {
      completion_indicator: string;
      optimal_path_steps: number;
      max_acceptable_steps: number;
      time_expectation_seconds: number;
    };
    potential_friction: string[];
  }>;
  task_flow_recommended: string[];
}

export interface ProblemSeverityMatrix {
  personas: Array<{
    persona_id: string;
    severity_level: 1 | 2 | 3 | 4;
    evidence: string;
    current_workarounds: string[];
    pain_intensity: number;
    willingness_to_pay_signal: string;
  }>;
  distribution: {
    level_4_hair_on_fire: number;
    level_3_painful: number;
    level_2_aware: number;
    level_1_latent: number;
  };
  pmf_readiness: string;
}

export interface DesignAudit {
  overall_score: {
    visual_design: number;
    accessibility: number;
    ui_patterns: number;
    responsive: number;
    total: number;
  };
  accessibility_summary: {
    violations_critical: number;
    violations_serious: number;
    violations_moderate: number;
    violations_minor: number;
    passes: number;
  };
  findings: Array<{
    category: string;
    severity: string;
    element: string;
    issue: string;
    impact: string;
    recommendation: string;
    wcag_criterion?: string;
  }>;
  strengths: string[];
  improvement_priorities: Array<{
    priority: number;
    area: string;
    reason: string;
    effort: 'low' | 'medium' | 'high';
  }>;
}

export interface DualCodingResult {
  themes: Array<{
    code: string;
    definition: string;
    frequency: number;
    examples: Array<{
      source: string;
      quote: string;
    }>;
    coder_agreement: boolean;
  }>;
  cohens_kappa: number;
  reliability_rating: 'excellent' | 'good' | 'moderate' | 'fair' | 'poor';
  disagreements: Array<{
    observation: string;
    coder1_code: string;
    coder2_code: string;
    resolution: string;
  }>;
  saturation_reached: boolean;
}

export interface SegmentHeatMap {
  segments: Array<{
    segment: string;
    personas: string[];
    problem_severity: number;
    current_alternative_satisfaction: number;
    willingness_to_switch: number;
    pmf_probability_score: number;
    recommendation: string;
  }>;
  desperate_users: {
    segment: string;
    evidence: string[];
  };
  best_pmf_opportunity: string;
}

export interface AnalysisResult {
  sus_score: number;
  sus_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  heart_metrics: {
    happiness: number;
    engagement: number;
    adoption: number;
    retention: number;
    task_success: number;
  };
  pmf_signals: {
    disappointment_score: number;
    aha_moment_rate: number;
    time_to_aha_avg_seconds: number;
    referral_specificity_rate: number;
    pmf_probability: number;
  };
  time_metrics: {
    avg_ttfma_seconds: number;
    hesitation_events_per_session: number;
    backtrack_rate: number;
  };
  qualitative_themes: Array<{
    theme: string;
    category: string;
    frequency: number;
    severity: string;
    evidence: string[];
    recommendation: string;
  }>;
  issue_inventory: Array<{
    issue_id: string;
    title: string;
    severity: string;
    frequency: number;
    personas_affected: string[];
    evidence_count: number;
    rice_score: number;
  }>;
  insights_summary: {
    top_strength: string;
    top_weakness: string;
    biggest_opportunity: string;
    biggest_risk: string;
    one_thing_to_fix: string;
  };
}

export interface CalibrationReport {
  internal_validity: number;
  cross_synthetic_reliability: number;
  human_synthetic_correlation_estimate: number;
  confidence_by_finding_type: Record<string, number>;
  disclaimers: string[];
  validation_recommendations: string[];
}

export interface ABHypotheses {
  hypotheses: Array<{
    id: string;
    issue_addressed: string;
    hypothesis: string;
    control: string;
    variant: string;
    primary_metric: string;
    expected_lift: string;
    confidence: number;
    sample_size_estimate: string;
    risk_level: 'low' | 'medium' | 'high';
  }>;
  prioritized_order: string[];
}

export interface Clip {
  clip_id: string;
  source_session: string;
  video_path: string;
  thumbnail_path?: string;
  duration_seconds: number;
  start_timestamp_ms: number;
  end_timestamp_ms: number;
  one_sentence_summary: string;
  transcript_segment: Array<{
    t: string;
    text: string;
  }>;
  tags: string[];
  persona: {
    id: string;
    segment: string;
    problem_severity: number;
  };
  clip_type: 'friction' | 'delight' | 'aha' | 'surprise' | 'abandonment';
  linked_issue?: string;
}

export interface ClipLibrary {
  total_clips: number;
  total_duration_minutes: number;
  sessions_analyzed: number;
  clips: Clip[];
  by_severity: Record<string, string[]>;
  by_feature: Record<string, string[]>;
  by_moment_type: Record<string, string[]>;
  by_persona: Record<string, string[]>;
}

export interface WeeklyDigest {
  week: string;
  generated_at: string;
  the_win: {
    clip_id: string;
    summary: string;
    duration_seconds: number;
    why_it_matters: string;
  };
  the_pain: {
    clip_id: string;
    summary: string;
    duration_seconds: number;
    why_it_matters: string;
  };
  the_surprise: {
    clip_id: string;
    summary: string;
    duration_seconds: number;
    contradicts_assumption: string;
  };
  metrics_snapshot: {
    disappointment_score: number;
    disappointment_trend: string;
    aha_moment_rate: number;
    top_friction_point: string;
  };
  one_thing_to_fix: {
    issue: string;
    expected_impact: string;
    linked_clip: string;
  };
}

export interface TimeBasedMetrics {
  ttfma_seconds: number;
  hesitation_events: Array<{
    timestamp_ms: number;
    duration_ms: number;
    context: string;
  }>;
  backtrack_events: Array<{
    timestamp_ms: number;
    from_url: string;
    to_url: string;
  }>;
  total_time_seconds: number;
  steps_count: number;
  optimal_steps: number;
  efficiency_score: number;
}
