import fs from 'fs';
import path from 'path';
import { OUTPUT_DIR } from '../utils/index.js';
import { renderAnnotationOutputs, FigmaAnnotationBatch } from '../figma/index.js';

export async function handleGenerateAnnotatedScreenshots(
  args: Record<string, unknown>
): Promise<string> {
  const studyDir = args.study_dir as string | undefined;
  const studyId = args.study_id as string | undefined;

  // Resolve study directory
  let resolvedStudyDir: string;
  if (studyDir) {
    resolvedStudyDir = path.isAbsolute(studyDir) ? studyDir : path.join(process.cwd(), studyDir);
  } else if (studyId) {
    resolvedStudyDir = path.join(OUTPUT_DIR, 'studies', studyId);
  } else {
    // Find the most recent study
    const studiesDir = path.join(OUTPUT_DIR, 'studies');
    if (!fs.existsSync(studiesDir)) {
      return JSON.stringify({
        success: false,
        error: 'No studies directory found. Run run_full_ux_study first.',
      });
    }
    const studies = fs.readdirSync(studiesDir)
      .filter(f => f.startsWith('study_'))
      .sort()
      .reverse();
    if (studies.length === 0) {
      return JSON.stringify({
        success: false,
        error: 'No studies found. Run run_full_ux_study first.',
      });
    }
    resolvedStudyDir = path.join(studiesDir, studies[0]);
  }

  // Check study directory exists
  if (!fs.existsSync(resolvedStudyDir)) {
    return JSON.stringify({
      success: false,
      error: `Study directory not found: ${resolvedStudyDir}`,
    });
  }

  // Load figma_annotations.json
  const annotationsPath = path.join(resolvedStudyDir, 'figma_annotations.json');
  if (!fs.existsSync(annotationsPath)) {
    return JSON.stringify({
      success: false,
      error: `No figma_annotations.json found in ${resolvedStudyDir}. The study may not have generated annotations.`,
    });
  }

  let batch: FigmaAnnotationBatch;
  try {
    const raw = fs.readFileSync(annotationsPath, 'utf-8');
    batch = JSON.parse(raw) as FigmaAnnotationBatch;
  } catch (e) {
    return JSON.stringify({
      success: false,
      error: `Failed to parse figma_annotations.json: ${(e as Error).message}`,
    });
  }

  // Validate batch has required fields
  if (!batch.annotations || !Array.isArray(batch.annotations)) {
    return JSON.stringify({
      success: false,
      error: 'Invalid figma_annotations.json: missing annotations array',
    });
  }

  // Check screenshots exist
  const missingScreenshots: string[] = [];
  for (const ann of batch.annotations) {
    if (!fs.existsSync(ann.screenshot_path)) {
      missingScreenshots.push(ann.screenshot_path);
    }
  }

  if (missingScreenshots.length === batch.annotations.length) {
    return JSON.stringify({
      success: false,
      error: 'No screenshots found. All annotation screenshot paths are missing.',
      missing_paths: missingScreenshots,
    });
  }

  // Generate annotated screenshots
  try {
    const { annotatedHtmlPaths, pluginDataPath } = renderAnnotationOutputs(batch, resolvedStudyDir);

    // List what was generated
    const annotatedDir = path.join(resolvedStudyDir, 'annotated_screenshots');
    const generatedFiles = fs.existsSync(annotatedDir)
      ? fs.readdirSync(annotatedDir).filter(f => f.endsWith('.html'))
      : [];

    return JSON.stringify({
      success: true,
      study_directory: resolvedStudyDir,
      annotations_count: batch.annotations.length,
      screenshots_processed: annotatedHtmlPaths.length,
      missing_screenshots: missingScreenshots.length > 0 ? missingScreenshots : undefined,
      outputs: {
        annotated_html_files: annotatedHtmlPaths,
        figma_plugin_import: pluginDataPath,
        annotated_screenshots_dir: annotatedDir,
      },
      generated_files: generatedFiles,
      message: `Generated ${annotatedHtmlPaths.length} annotated screenshot HTML files. Open them in a browser to see the visual overlays.`,
      usage_hint: 'Open the HTML files in a browser - they embed the screenshot with interactive severity-coded overlays.',
    }, null, 2);

  } catch (e) {
    return JSON.stringify({
      success: false,
      error: `Failed to generate annotated screenshots: ${(e as Error).message}`,
      stack: (e as Error).stack,
    });
  }
}
