/**
 * Isolated test: screenshot annotation pipeline on a single image.
 * Run: node test-annotation-isolated.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateFigmaAnnotations } from './dist/ai-executor/tasks.js';
import { renderAnnotationOutputs } from './dist/figma/index.js';
import { handleExportAnnotations } from './dist/handlers/export-annotations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Note: filename uses Unicode narrow no-break space (\u202f) before "PM"
const SCREENSHOT_PATH = '/Users/alhassanahmed/Desktop/User Testing Agentic Framework/Screenshot 2026-03-18 at 7.06.08\u202fPM.png';
const OUTPUT_DIR = path.join(__dirname, 'output', 'test-annotation-run');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Copy screenshot into the output dir so annotation paths are consistent
const screenshotDest = path.join(OUTPUT_DIR, 'login_screen.png');
fs.copyFileSync(SCREENSHOT_PATH, screenshotDest);

// Mock visual captures — two captures simulating a real study (landing + login)
const visualCaptures = [
  {
    label: 'landing',
    url: 'https://danchou.app/',
    path: path.join(OUTPUT_DIR, 'landing_screen.png'),  // doesn't exist — tests fallback
  },
  {
    label: 'login',
    url: 'https://danchou.app/login',
    path: screenshotDest,
  },
];

// Simulate REAL STUDY highlight format: source = session JSON filename (NOT a URL),
// screenshot = resolved path. This is the format full-study.js actually produces.
const highlights = [
  {
    id: 'hl_no_remember_me',
    persona_id: 'casual_user',
    persona_name: 'Casual User',
    type: 'friction',
    severity: 'medium',
    title: 'No "Remember Me" checkbox',
    evidence: 'Users have to re-enter credentials every session with no persistent login option.',
    source: 'session_casual_user.json',   // ← real study format: session filename
    screenshot: screenshotDest,           // ← correct path set by pickScreenshot()
  },
  {
    id: 'hl_login_button',
    persona_id: 'new_visitor',
    persona_name: 'New Visitor',
    type: 'friction',
    severity: 'high',
    title: 'LOGIN button lacks visual hierarchy',
    evidence: 'The primary CTA button blends with background and lacks contrast for quick scanning.',
    source: 'session_new_visitor.json',
    screenshot: screenshotDest,
  },
  {
    id: 'hl_social_login',
    persona_id: 'power_user',
    persona_name: 'Power User',
    type: 'aha',
    severity: 'low',
    title: 'Social login options available (Google/Facebook/GitHub)',
    evidence: 'Multiple social login paths reduce friction for returning users.',
    source: 'session_power_user.json',
    screenshot: screenshotDest,
  },
  {
    id: 'hl_register_link',
    persona_id: 'new_visitor',
    persona_name: 'New Visitor',
    type: 'friction',
    severity: 'critical',
    title: '"Please Register" link is barely visible',
    evidence: 'The registration CTA is small, low contrast text at the bottom — new users miss it.',
    source: 'session_new_visitor.json',
    screenshot: screenshotDest,
  },
  {
    id: 'hl_password_field',
    persona_id: 'casual_user',
    persona_name: 'Casual User',
    type: 'friction',
    severity: 'medium',
    title: 'No password visibility toggle',
    evidence: 'Users cannot verify their password before submitting, leading to login failures.',
    source: 'session_casual_user.json',
    screenshot: screenshotDest,
  },
];

console.log('=== ISOLATED ANNOTATION TEST ===');
console.log(`Screenshot: ${screenshotDest}`);
console.log(`Findings:   ${highlights.length}`);
console.log(`Output dir: ${OUTPUT_DIR}`);
console.log('');

try {
  // Step 1: Generate annotations via vision LLM
  console.log('Step 1: Calling generateFigmaAnnotations...');
  const batch = await generateFigmaAnnotations('Danchou', visualCaptures, highlights);
  console.log(`  → ${batch.annotations.length} annotations generated`);
  
  // Write the raw batch for inspection
  const batchPath = path.join(OUTPUT_DIR, 'figma_annotations.json');
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2));
  console.log(`  → Batch written to: ${batchPath}`);

  // Show what rects we got
  console.log('\nAnnotation rects:');
  for (const ann of batch.annotations) {
    const r = ann.rect_pct;
    console.log(`  [${ann.severity}] ${ann.title}`);
    console.log(`    rect: x=${r.x}% y=${r.y}% w=${r.width}% h=${r.height}%`);
    console.log(`    element: ${ann.element_description ?? '(none — likely used fallback)'}`);
  }

  // Step 2a: Render annotated HTML
  console.log('\nStep 2a: Rendering annotated HTML...');
  const { annotatedHtmlPaths, pluginDataPath } = renderAnnotationOutputs(batch, OUTPUT_DIR);
  console.log(`  → ${annotatedHtmlPaths.length} HTML files generated`);
  if (annotatedHtmlPaths.length > 0) {
    console.log(`  → Open: ${annotatedHtmlPaths[0]}`);
  }

  // Step 2b: Export annotated PNG
  console.log('\nStep 2b: Exporting annotated PNG...');
  const exportResult = await handleExportAnnotations({
    study_dir: OUTPUT_DIR,
    formats: ['png'],
  });
  const parsed = JSON.parse(exportResult);
  if (parsed.success) {
    console.log(`  → PNG(s): ${parsed.outputs.png.join(', ')}`);
  } else {
    console.log(`  → Export failed: ${parsed.error}`);
  }

  console.log('\n=== TEST COMPLETE ===');
  console.log(`Check output at: ${OUTPUT_DIR}`);
} catch (err) {
  console.error('\n=== TEST FAILED ===');
  console.error(err);
  process.exit(1);
}
