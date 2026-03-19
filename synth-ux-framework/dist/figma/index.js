/**
 * Figma Integration & Annotated Screenshot Module
 *
 * Generates two outputs from UX findings + screenshots:
 *  1. figma_annotations.json  — structured data for Figma import
 *  2. annotated_screenshots/  — self-contained HTML files with the screenshot
 *     image + colour-coded bounding box overlays. Each box shows the finding
 *     title/severity on hover and includes an index callout bubble.
 *
 * Bounding box coordinates come from vision LLM analysis (see tasks.ts →
 * generateFigmaAnnotations). This module focuses purely on rendering them.
 */
import fs from 'fs';
import path from 'path';
// ─── Color helpers ────────────────────────────────────────────────────────────
const SEVERITY_HEX = {
    critical: '#EF4444',
    high: '#F97316',
    medium: '#EAB308',
    low: '#3B82F6',
};
const SEVERITY_BG = {
    critical: 'rgba(239,68,68,0.12)',
    high: 'rgba(249,115,22,0.12)',
    medium: 'rgba(234,179,8,0.12)',
    low: 'rgba(59,130,246,0.12)',
};
function hexFor(severity) {
    return SEVERITY_HEX[severity?.toLowerCase()] ?? SEVERITY_HEX.medium;
}
function bgFor(severity) {
    return SEVERITY_BG[severity?.toLowerCase()] ?? SEVERITY_BG.medium;
}
export function severityToColor(severity) {
    return hexFor(severity).replace('#', '');
}
// ─── Annotated HTML generator ─────────────────────────────────────────────────
/**
 * For each unique screenshot, produce a self-contained HTML file that embeds
 * the image as a base64 data URI and overlays all findings as coloured boxes.
 *
 * Returns an array of paths to the generated HTML files.
 */
export function generateAnnotatedScreenshots(batch, outputDir) {
    const annotationsDir = path.join(outputDir, 'annotated_screenshots');
    if (!fs.existsSync(annotationsDir))
        fs.mkdirSync(annotationsDir, { recursive: true });
    // Group by screenshot
    const byScreenshot = new Map();
    for (const ann of batch.annotations) {
        if (!byScreenshot.has(ann.screenshot_path))
            byScreenshot.set(ann.screenshot_path, []);
        byScreenshot.get(ann.screenshot_path).push(ann);
    }
    const outputPaths = [];
    for (const [screenshotPath, annotations] of byScreenshot) {
        if (!fs.existsSync(screenshotPath))
            continue;
        const imageBase64 = fs.readFileSync(screenshotPath).toString('base64');
        const label = path.basename(screenshotPath, '.png');
        const html = buildAnnotatedHTML(batch.app_name, label, imageBase64, annotations);
        const outFile = path.join(annotationsDir, `${label}_annotated.html`);
        fs.writeFileSync(outFile, html, 'utf-8');
        outputPaths.push(outFile);
    }
    return outputPaths;
}
function buildAnnotatedHTML(appName, label, imageBase64, annotations) {
    const overlays = annotations.map((ann, i) => {
        const { x, y, width, height } = ann.rect_pct;
        const hex = hexFor(ann.severity);
        const bg = bgFor(ann.severity);
        const num = i + 1;
        const escapedTitle = escapeHtml(ann.title);
        const escapedDesc = escapeHtml(ann.description);
        const elementHint = ann.element_description ? ` <em style="opacity:0.75">(${escapeHtml(ann.element_description)})</em>` : '';
        return `
    <div class="ann-box sev-${ann.severity}"
         style="left:${x}%;top:${y}%;width:${width}%;height:${height}%;border-color:${hex};background:${bg};"
         data-num="${num}">
      <span class="ann-num" style="background:${hex};">${num}</span>
      <div class="ann-tooltip">
        <div class="tt-header" style="background:${hex};">
          <span class="tt-num">${num}</span>
          <span class="tt-sev">${ann.severity.toUpperCase()}</span>
        </div>
        <div class="tt-body">
          <p class="tt-title">${escapedTitle}${elementHint}</p>
          <p class="tt-desc">${escapedDesc}</p>
        </div>
      </div>
    </div>`;
    }).join('\n');
    const legendItems = annotations.map((ann, i) => `
    <div class="leg-item" data-num="${i + 1}">
      <span class="leg-num" style="background:${hexFor(ann.severity)};">${i + 1}</span>
      <div class="leg-text">
        <strong>${escapeHtml(ann.title)}</strong>
        <span class="leg-meta">${ann.severity} · ${ann.type ?? ''}</span>
        <p>${escapeHtml(ann.description)}</p>
        ${ann.element_description ? `<em class="leg-element">${escapeHtml(ann.element_description)}</em>` : ''}
      </div>
    </div>`).join('\n');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(appName)} · ${escapeHtml(label)} · UX Annotations</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f0f12;
      color: #e4e4e7;
      min-height: 100vh;
    }

    /* ── Header ── */
    .page-header {
      padding: 18px 28px;
      border-bottom: 1px solid #27272a;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .page-header h1 { font-size: 15px; font-weight: 600; color: #fafafa; }
    .page-header span { font-size: 13px; color: #71717a; }
    .badge {
      margin-left: auto;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      background: #27272a;
      color: #a1a1aa;
    }

    /* ── Layout ── */
    .layout { display: flex; gap: 0; height: calc(100vh - 57px); }

    /* ── Screenshot pane ── */
    .screenshot-pane {
      flex: 1;
      overflow: auto;
      padding: 28px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
    .img-wrapper {
      position: relative;
      display: inline-block;
      max-width: 100%;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 0 0 1px #27272a, 0 20px 60px rgba(0,0,0,0.6);
    }
    .img-wrapper img {
      display: block;
      max-width: 100%;
      height: auto;
    }

    /* ── Annotation overlays ── */
    .ann-box {
      position: absolute;
      border: 2px solid;
      border-radius: 4px;
      cursor: pointer;
      transition: border-width 0.15s, box-shadow 0.15s;
    }
    .ann-box:hover {
      border-width: 3px;
      box-shadow: 0 0 0 2px rgba(255,255,255,0.1);
      z-index: 100;
    }
    .ann-box:hover .ann-tooltip { opacity: 1; pointer-events: auto; transform: translateY(0); }

    .ann-num {
      position: absolute;
      top: -11px;
      left: -11px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    }

    /* ── Tooltip ── */
    .ann-tooltip {
      position: absolute;
      bottom: calc(100% + 10px);
      left: 0;
      min-width: 280px;
      max-width: 340px;
      background: #18181b;
      border: 1px solid #3f3f46;
      border-radius: 8px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.6);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s, transform 0.15s;
      transform: translateY(6px);
      z-index: 200;
      overflow: hidden;
    }
    .tt-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
    }
    .tt-num {
      width: 20px; height: 20px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: #fff;
    }
    .tt-sev { font-size: 11px; font-weight: 700; color: #fff; letter-spacing: 0.06em; }
    .tt-body { padding: 10px 12px 12px; }
    .tt-title { font-size: 13px; font-weight: 600; color: #fafafa; line-height: 1.4; margin-bottom: 6px; }
    .tt-desc { font-size: 12px; color: #a1a1aa; line-height: 1.5; }

    /* ── Legend panel ── */
    .legend-pane {
      width: 320px;
      min-width: 320px;
      border-left: 1px solid #27272a;
      overflow-y: auto;
      padding: 20px 0;
    }
    .legend-title {
      padding: 0 20px 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #52525b;
      text-transform: uppercase;
    }
    .leg-item {
      display: flex;
      gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid #1c1c1f;
      transition: background 0.1s;
      cursor: default;
    }
    .leg-item:hover { background: #18181b; }
    .leg-num {
      flex-shrink: 0;
      width: 24px; height: 24px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: #fff;
      margin-top: 2px;
    }
    .leg-text { flex: 1; min-width: 0; }
    .leg-text strong { font-size: 13px; color: #fafafa; display: block; line-height: 1.4; }
    .leg-meta { font-size: 11px; color: #52525b; text-transform: uppercase; letter-spacing: 0.05em; margin: 2px 0 6px; display: block; }
    .leg-text p { font-size: 12px; color: #71717a; line-height: 1.5; }
    .leg-element { display: block; margin-top: 5px; font-size: 11px; color: #3f3f46; font-style: italic; }

    /* ── Severity colour dots ── */
    .sev-critical .ann-num { background: #EF4444; }
    .sev-high     .ann-num { background: #F97316; }
    .sev-medium   .ann-num { background: #EAB308; }
    .sev-low      .ann-num { background: #3B82F6; }
  </style>
</head>
<body>
  <header class="page-header">
    <h1>${escapeHtml(appName)}</h1>
    <span>›</span>
    <span>${escapeHtml(label.replace(/_/g, ' '))}</span>
    <span class="badge">${annotations.length} finding${annotations.length !== 1 ? 's' : ''}</span>
  </header>

  <div class="layout">
    <section class="screenshot-pane">
      <div class="img-wrapper">
        <img src="data:image/png;base64,${imageBase64}" alt="${escapeHtml(label)} screenshot" draggable="false">
        ${overlays}
      </div>
    </section>

    <aside class="legend-pane">
      <p class="legend-title">Findings</p>
      ${legendItems}
    </aside>
  </div>
</body>
</html>`;
}
// ─── Figma plugin data (unchanged) ───────────────────────────────────────────
export function generateFigmaPluginData(batch, outputDir) {
    const pluginData = {
        version: '1.0',
        type: 'synth-ux-annotations',
        metadata: {
            app_name: batch.app_name,
            generated_at: batch.generated_at,
            total_annotations: batch.annotations.length,
        },
        frames: groupAnnotationsByScreenshot(batch.annotations),
    };
    const outputPath = path.join(outputDir, 'figma_plugin_import.json');
    fs.writeFileSync(outputPath, JSON.stringify(pluginData, null, 2));
    return outputPath;
}
function groupAnnotationsByScreenshot(annotations) {
    const grouped = {};
    for (const ann of annotations) {
        if (!grouped[ann.screenshot_path])
            grouped[ann.screenshot_path] = [];
        grouped[ann.screenshot_path].push(ann);
    }
    return grouped;
}
// ─── Full pipeline ────────────────────────────────────────────────────────────
/**
 * Render all outputs for a completed annotation batch:
 *  - annotated_screenshots/*.html  (visual overlays, the main deliverable)
 *  - figma_plugin_import.json      (for manual Figma import)
 *
 * Call this AFTER generateFigmaAnnotations() has already produced the batch
 * with vision-accurate rect_pct values.
 */
export function renderAnnotationOutputs(batch, outputDir) {
    const annotatedHtmlPaths = generateAnnotatedScreenshots(batch, outputDir);
    const pluginDataPath = generateFigmaPluginData(batch, outputDir);
    return { annotatedHtmlPaths, pluginDataPath };
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(text) {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
