import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { OUTPUT_DIR } from '../utils/index.js';
const SEVERITY_COLORS = {
    critical: { r: 239, g: 68, b: 68, hex: '#EF4444' },
    high: { r: 249, g: 115, b: 22, hex: '#F97316' },
    medium: { r: 234, g: 179, b: 8, hex: '#EAB308' },
    low: { r: 59, g: 130, b: 246, hex: '#3B82F6' },
};
function getColor(severity) {
    return SEVERITY_COLORS[severity?.toLowerCase()] || SEVERITY_COLORS.medium;
}
async function generateAnnotatedPNG(screenshotPath, annotations, outputPath) {
    const image = sharp(screenshotPath);
    const metadata = await image.metadata();
    const width = metadata.width || 1280;
    const height = metadata.height || 720;
    // Create SVG overlay with annotations
    const svgParts = [];
    for (let i = 0; i < annotations.length; i++) {
        const ann = annotations[i];
        const color = getColor(ann.severity);
        const { x, y, width: w, height: h } = ann.rect_pct;
        // Convert percentages to pixels
        const px = Math.round((x / 100) * width);
        const py = Math.round((y / 100) * height);
        const pw = Math.round((w / 100) * width);
        const ph = Math.round((h / 100) * height);
        // Draw rectangle with semi-transparent fill
        svgParts.push(`
      <rect x="${px}" y="${py}" width="${pw}" height="${ph}" 
            fill="${color.hex}20" stroke="${color.hex}" stroke-width="3" rx="4"/>
    `);
        // Draw number badge
        const badgeSize = 28;
        const badgeX = px - 10;
        const badgeY = py - 10;
        svgParts.push(`
      <circle cx="${badgeX + badgeSize / 2}" cy="${badgeY + badgeSize / 2}" r="${badgeSize / 2}" 
              fill="${color.hex}" stroke="white" stroke-width="2"/>
      <text x="${badgeX + badgeSize / 2}" y="${badgeY + badgeSize / 2 + 5}" 
            text-anchor="middle" fill="white" font-family="Arial, sans-serif" 
            font-size="14" font-weight="bold">${i + 1}</text>
    `);
        // Draw label below the box
        const labelY = py + ph + 20;
        const labelText = `${i + 1}. ${ann.title}`;
        const truncatedLabel = labelText.length > 50 ? labelText.substring(0, 47) + '...' : labelText;
        svgParts.push(`
      <rect x="${px}" y="${labelY - 16}" width="${truncatedLabel.length * 8 + 16}" height="24" 
            fill="${color.hex}" rx="4"/>
      <text x="${px + 8}" y="${labelY}" fill="white" font-family="Arial, sans-serif" 
            font-size="12" font-weight="600">${escapeXml(truncatedLabel)}</text>
    `);
    }
    const svgOverlay = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${svgParts.join('\n')}
    </svg>
  `;
    await image
        .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
        .png()
        .toFile(outputPath);
}
function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function generateMarkdown(batch, studyDir) {
    const lines = [];
    lines.push(`# UX Findings Report: ${batch.app_name}`);
    lines.push('');
    lines.push(`**Generated:** ${batch.generated_at}`);
    lines.push(`**Total Findings:** ${batch.annotations.length}`);
    lines.push('');
    // Summary by severity
    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const ann of batch.annotations) {
        const sev = ann.severity?.toLowerCase();
        if (sev in bySeverity)
            bySeverity[sev]++;
    }
    lines.push('## Summary');
    lines.push('');
    lines.push('| Severity | Count |');
    lines.push('|----------|-------|');
    lines.push(`| 🔴 Critical | ${bySeverity.critical} |`);
    lines.push(`| 🟠 High | ${bySeverity.high} |`);
    lines.push(`| 🟡 Medium | ${bySeverity.medium} |`);
    lines.push(`| 🔵 Low | ${bySeverity.low} |`);
    lines.push('');
    // Group by screenshot
    const byScreenshot = new Map();
    for (const ann of batch.annotations) {
        const key = path.basename(ann.screenshot_path, '.png');
        if (!byScreenshot.has(key))
            byScreenshot.set(key, []);
        byScreenshot.get(key).push(ann);
    }
    lines.push('---');
    lines.push('');
    lines.push('## Findings by Screen');
    lines.push('');
    for (const [screen, annotations] of byScreenshot) {
        lines.push(`### ${screen.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`);
        lines.push('');
        lines.push(`![${screen}](./annotated_images/${screen}_annotated.png)`);
        lines.push('');
        for (let i = 0; i < annotations.length; i++) {
            const ann = annotations[i];
            const severityEmoji = {
                critical: '🔴',
                high: '🟠',
                medium: '🟡',
                low: '🔵',
            }[ann.severity?.toLowerCase()] || '⚪';
            lines.push(`#### ${i + 1}. ${ann.title}`);
            lines.push('');
            lines.push(`**Severity:** ${severityEmoji} ${ann.severity?.toUpperCase()}`);
            lines.push('');
            lines.push(`> ${ann.description}`);
            lines.push('');
            if (ann.element_description) {
                lines.push(`*Element:* ${ann.element_description}`);
                lines.push('');
            }
            lines.push(`*Location:* x=${ann.rect_pct.x}%, y=${ann.rect_pct.y}%, w=${ann.rect_pct.width}%, h=${ann.rect_pct.height}%`);
            lines.push('');
        }
    }
    lines.push('---');
    lines.push('');
    lines.push('## Raw Data');
    lines.push('');
    lines.push('See `annotations_export.json` for machine-readable data.');
    lines.push('');
    return lines.join('\n');
}
function generateJSON(batch) {
    return {
        meta: {
            app_name: batch.app_name,
            generated_at: batch.generated_at,
            total_findings: batch.annotations.length,
            export_version: '1.0',
        },
        summary: {
            by_severity: batch.annotations.reduce((acc, ann) => {
                const sev = ann.severity?.toLowerCase() || 'unknown';
                acc[sev] = (acc[sev] || 0) + 1;
                return acc;
            }, {}),
            by_screen: batch.annotations.reduce((acc, ann) => {
                const screen = path.basename(ann.screenshot_path, '.png');
                acc[screen] = (acc[screen] || 0) + 1;
                return acc;
            }, {}),
        },
        findings: batch.annotations.map((ann, i) => ({
            id: ann.id,
            index: i + 1,
            title: ann.title,
            description: ann.description,
            severity: ann.severity,
            type: ann.type,
            screen: path.basename(ann.screenshot_path, '.png'),
            element: ann.element_description,
            location: ann.rect_pct,
            linked_highlight_id: ann.linked_highlight_id,
        })),
    };
}
export async function handleExportAnnotations(args) {
    const studyDir = args.study_dir;
    const studyId = args.study_id;
    const formats = args.formats || ['png', 'json', 'markdown'];
    // Resolve study directory
    let resolvedStudyDir;
    if (studyDir) {
        resolvedStudyDir = path.isAbsolute(studyDir) ? studyDir : path.join(process.cwd(), studyDir);
    }
    else if (studyId) {
        resolvedStudyDir = path.join(OUTPUT_DIR, 'studies', studyId);
    }
    else {
        const studiesDir = path.join(OUTPUT_DIR, 'studies');
        if (!fs.existsSync(studiesDir)) {
            return JSON.stringify({ success: false, error: 'No studies directory found.' });
        }
        const studies = fs.readdirSync(studiesDir).filter(f => f.startsWith('study_')).sort().reverse();
        if (studies.length === 0) {
            return JSON.stringify({ success: false, error: 'No studies found.' });
        }
        resolvedStudyDir = path.join(studiesDir, studies[0]);
    }
    if (!fs.existsSync(resolvedStudyDir)) {
        return JSON.stringify({ success: false, error: `Study directory not found: ${resolvedStudyDir}` });
    }
    // Load annotations
    const annotationsPath = path.join(resolvedStudyDir, 'figma_annotations.json');
    if (!fs.existsSync(annotationsPath)) {
        return JSON.stringify({ success: false, error: 'No figma_annotations.json found.' });
    }
    const batch = JSON.parse(fs.readFileSync(annotationsPath, 'utf-8'));
    const outputs = { png: [], json: [], markdown: [] };
    // Create export directory
    const exportDir = path.join(resolvedStudyDir, 'exports');
    const imagesDir = path.join(exportDir, 'annotated_images');
    fs.mkdirSync(imagesDir, { recursive: true });
    // Group annotations by screenshot
    const byScreenshot = new Map();
    for (const ann of batch.annotations) {
        if (!byScreenshot.has(ann.screenshot_path))
            byScreenshot.set(ann.screenshot_path, []);
        byScreenshot.get(ann.screenshot_path).push(ann);
    }
    // Generate PNG images
    if (formats.includes('png')) {
        for (const [screenshotPath, annotations] of byScreenshot) {
            if (!fs.existsSync(screenshotPath))
                continue;
            const baseName = path.basename(screenshotPath, '.png');
            const outputPath = path.join(imagesDir, `${baseName}_annotated.png`);
            await generateAnnotatedPNG(screenshotPath, annotations, outputPath);
            outputs.png.push(outputPath);
        }
    }
    // Generate JSON
    if (formats.includes('json')) {
        const jsonPath = path.join(exportDir, 'annotations_export.json');
        fs.writeFileSync(jsonPath, JSON.stringify(generateJSON(batch), null, 2));
        outputs.json.push(jsonPath);
    }
    // Generate Markdown
    if (formats.includes('markdown')) {
        const mdPath = path.join(exportDir, 'FINDINGS_REPORT.md');
        fs.writeFileSync(mdPath, generateMarkdown(batch, resolvedStudyDir));
        outputs.markdown.push(mdPath);
    }
    return JSON.stringify({
        success: true,
        study_directory: resolvedStudyDir,
        export_directory: exportDir,
        findings_count: batch.annotations.length,
        outputs,
        message: `Exported ${batch.annotations.length} findings to ${Object.values(outputs).flat().length} files.`,
    }, null, 2);
}
