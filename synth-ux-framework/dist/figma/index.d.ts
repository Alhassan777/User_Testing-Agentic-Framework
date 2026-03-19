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
import { FigmaAnnotation, FigmaAnnotationBatch } from '../ai-executor/types.js';
export type { FigmaAnnotation, FigmaAnnotationBatch };
export declare function severityToColor(severity: string): string;
/**
 * For each unique screenshot, produce a self-contained HTML file that embeds
 * the image as a base64 data URI and overlays all findings as coloured boxes.
 *
 * Returns an array of paths to the generated HTML files.
 */
export declare function generateAnnotatedScreenshots(batch: FigmaAnnotationBatch, outputDir: string): string[];
export declare function generateFigmaPluginData(batch: FigmaAnnotationBatch, outputDir: string): string;
/**
 * Render all outputs for a completed annotation batch:
 *  - annotated_screenshots/*.html  (visual overlays, the main deliverable)
 *  - figma_plugin_import.json      (for manual Figma import)
 *
 * Call this AFTER generateFigmaAnnotations() has already produced the batch
 * with vision-accurate rect_pct values.
 */
export declare function renderAnnotationOutputs(batch: FigmaAnnotationBatch, outputDir: string): {
    annotatedHtmlPaths: string[];
    pluginDataPath: string;
};
