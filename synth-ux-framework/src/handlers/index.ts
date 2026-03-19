import {
  handleSynthUxFullTest,
  handleHeuristicEvaluate,
  handlePersonaGenerate,
  handleSessionSimulate,
  handleJtbdAnalyze,
  handleProblemSeverityClassify,
  handleReflectionInterview,
  handleReportGenerate,
  handleSegmentHeatMap,
  handleVoiceOfUserDigest,
  handleListAgents,
} from './agents.js';
import {
  handleVideoStartRecording,
  handleVideoStopRecording,
  handleVideoListRecordings,
} from './video.js';
import { handleAccessibilityScan } from './accessibility.js';
import { handleLighthouseAudit } from './lighthouse.js';
import { handleRunAutonomousUxTest } from './autonomous.js';
import { handleRunFullUxStudy } from './full-study.js';
import { handleAnalyzeGitHubRepo, handleSearchCompetitors } from './research.js';
import { handleGenerateAnnotatedScreenshots } from './annotated-screenshots.js';
import { handleExportAnnotations } from './export-annotations.js';

export async function handleToolCall(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    // Protocol-based agent tools (return markdown instructions)
    case 'synth_ux_full_test':
      return handleSynthUxFullTest(args);
    case 'heuristic_evaluate':
      return handleHeuristicEvaluate(args);
    case 'persona_generate':
      return handlePersonaGenerate(args);
    case 'session_simulate':
      return handleSessionSimulate(args);
    case 'jtbd_analyze':
      return handleJtbdAnalyze(args);
    case 'problem_severity_classify':
      return handleProblemSeverityClassify(args);
    case 'reflection_interview':
      return handleReflectionInterview(args);
    case 'report_generate':
      return handleReportGenerate(args);
    case 'segment_heat_map':
      return handleSegmentHeatMap(args);
    case 'voice_of_user_digest':
      return handleVoiceOfUserDigest(args);
    case 'list_agents':
      return handleListAgents();

    // Video recording tools
    case 'video_start_recording':
      return await handleVideoStartRecording(args);
    case 'video_stop_recording':
      return await handleVideoStopRecording(args);
    case 'video_list_recordings':
      return await handleVideoListRecordings();

    // Accessibility tool
    case 'accessibility_scan':
      return await handleAccessibilityScan(args);

    // Lighthouse tool
    case 'lighthouse_audit':
      return await handleLighthouseAudit(args);

    // Autonomous test (Playwright-based)
    case 'run_autonomous_ux_test':
      return await handleRunAutonomousUxTest(args);

    // Full AI-powered UX study (orchestrated)
    case 'run_full_ux_study':
      return await handleRunFullUxStudy(args);

    // Research tools (GitHub + Web Search)
    case 'analyze_github_repo':
      return await handleAnalyzeGitHubRepo(args);
    case 'search_competitors':
      return await handleSearchCompetitors(args);

    // Annotated screenshots
    case 'generate_annotated_screenshots':
      return await handleGenerateAnnotatedScreenshots(args);

    // Export annotations (PNG, JSON, Markdown)
    case 'export_annotations':
      return await handleExportAnnotations(args);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
