import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { OUTPUT_DIR } from '../utils/index.js';
export async function handleAccessibilityScan(args) {
    const url = args.url;
    const standard = args.standard || 'wcag21aa';
    try {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'networkidle' });
        const axeBuilder = new AxeBuilder({ page }).withTags([standard]);
        const results = await axeBuilder.analyze();
        await context.close();
        await browser.close();
        const summary = {
            url,
            standard,
            timestamp: new Date().toISOString(),
            summary: {
                violations: results.violations.length,
                passes: results.passes.length,
                incomplete: results.incomplete.length,
                inapplicable: results.inapplicable.length,
            },
            violations: results.violations.map(v => ({
                id: v.id,
                impact: v.impact,
                description: v.description,
                help: v.help,
                helpUrl: v.helpUrl,
                nodes_affected: v.nodes.length,
                wcag_tags: v.tags.filter(t => t.startsWith('wcag')),
                elements: v.nodes.slice(0, 3).map(n => ({
                    html: n.html.substring(0, 200),
                    target: n.target,
                    failureSummary: n.failureSummary,
                })),
            })),
            top_passes: results.passes.slice(0, 5).map(p => ({
                id: p.id,
                description: p.description,
            })),
        };
        const reportsDir = path.join(OUTPUT_DIR, 'accessibility');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        const reportPath = path.join(reportsDir, `axe_${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        return JSON.stringify({
            ...summary,
            full_report_saved_to: reportPath,
        }, null, 2);
    }
    catch (error) {
        return JSON.stringify({
            success: false,
            error: error.message,
        }, null, 2);
    }
}
