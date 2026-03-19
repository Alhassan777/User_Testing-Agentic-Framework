import { GitHubAppBrief } from './github.js';
import { ABHypotheses, AnalysisResult, AppBrief, CalibrationReport, Clip, ClipLibrary, CompetitorProfile, DesignAudit, DualCodingResult, FigmaAnnotationBatch, FirstClickAnalysis, HeuristicEvaluation, JTBDAnalysis, Persona, ProblemSeverityMatrix, ReflectionInterview, SegmentHeatMap, SessionTrace, StudyHighlight, TaskList, TimeBasedMetrics, VisualCapture, WeeklyDigest } from './types.js';
export declare function generatePersonas(appContext: string, count?: number): Promise<Persona[]>;
export declare function simulateSession(persona: Persona, pageContent: string, pageUrl: string, tasks: string[]): Promise<SessionTrace>;
export declare function conductInterview(persona: Persona, sessionSummary: string): Promise<ReflectionInterview>;
export declare function analyzeJTBD(appDescription: string, landingPageContent: string): Promise<JTBDAnalysis>;
export declare function discoverCompetitors(appName: string, appDescription: string, landingPageContent: string, count?: number): Promise<CompetitorProfile[]>;
/**
 * Generate app brief from GitHub repository (enhanced intelligence)
 */
export declare function generateAppBriefFromRepo(repoUrl: string): Promise<GitHubAppBrief | null>;
/**
 * Fetch GitHub repository information for context enrichment
 */
export declare function fetchRepoContext(repoUrl: string): Promise<import("./github.js").GitHubRepoInfo | null>;
export declare function generateCompetitorComparison(appName: string, appDescription: string, competitors: CompetitorProfile[], personas: Persona[], sessions: SessionTrace[], interviews: ReflectionInterview[], jtbd: JTBDAnalysis): Promise<string>;
export declare function generateInsights(appName: string, personas: Persona[], sessions: SessionTrace[], interviews: ReflectionInterview[], jtbd: JTBDAnalysis, lighthouse: unknown, accessibility: unknown, extraContext?: Record<string, unknown>): Promise<string>;
/**
 * Vision-based annotation: for each screenshot, the LLM actually looks at the image
 * and identifies precise bounding box locations for each UX finding.
 * Falls back to text-only analysis if the screenshot file is missing.
 */
export declare function generateFigmaAnnotations(appName: string, visualCaptures: VisualCapture[], highlights: StudyHighlight[]): Promise<FigmaAnnotationBatch>;
export declare function evaluateHeuristics(pageUrl: string, pageContent: string, screenshotDescriptions: string[]): Promise<HeuristicEvaluation>;
export declare function analyzeFirstClick(pages: Array<{
    url: string;
    content: string;
    screenshot: string;
}>, tasks: string[]): Promise<FirstClickAnalysis>;
export declare function generateAppBrief(url: string, landingPageContent: string, navigationLinks: string[], screenshotDescriptions: string[]): Promise<AppBrief>;
export declare function deriveTaskList(appBrief: AppBrief, personas: Persona[], jtbd: JTBDAnalysis): Promise<TaskList>;
export declare function classifyProblemSeverity(personas: Persona[], sessions: SessionTrace[], interviews: ReflectionInterview[]): Promise<ProblemSeverityMatrix>;
export declare function generateDesignAudit(pageContent: string, accessibilityResults: unknown, screenshotDescriptions: string[]): Promise<DesignAudit>;
export declare function performDualCoding(sessions: SessionTrace[], interviews: ReflectionInterview[]): Promise<DualCodingResult>;
export declare function generateSegmentHeatMap(personas: Persona[], problemSeverity: ProblemSeverityMatrix, sessions: SessionTrace[], interviews: ReflectionInterview[]): Promise<SegmentHeatMap>;
export declare function generateAnalysis(personas: Persona[], sessions: SessionTrace[], interviews: ReflectionInterview[], jtbd: JTBDAnalysis, problemSeverity: ProblemSeverityMatrix, dualCoding: DualCodingResult, designAudit: DesignAudit | null, competitors: CompetitorProfile[]): Promise<AnalysisResult>;
export declare function generateCalibrationReport(sessions: SessionTrace[], interviews: ReflectionInterview[], analysisResult: AnalysisResult): Promise<CalibrationReport>;
export declare function generateABHypotheses(analysisResult: AnalysisResult, appBrief: AppBrief): Promise<ABHypotheses>;
export declare function extractClips(sessions: SessionTrace[], interviews: ReflectionInterview[], personas: Persona[], videoPath: string): Promise<Clip[]>;
export declare function buildClipLibrary(clips: Clip[], sessions: SessionTrace[]): Promise<ClipLibrary>;
export declare function generateWeeklyDigest(clipLibrary: ClipLibrary, analysisResult: AnalysisResult, weekLabel: string): Promise<WeeklyDigest>;
export declare function analyzeTimeMetrics(session: SessionTrace, optimalSteps: number): Promise<TimeBasedMetrics>;
