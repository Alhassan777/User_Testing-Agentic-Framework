import fs from 'fs';
import path from 'path';
import { OUTPUT_DIR } from '../utils/index.js';
export async function handleLighthouseAudit(args) {
    const url = args.url;
    const categories = args.categories || ['performance', 'accessibility', 'best-practices', 'seo'];
    try {
        const lighthouse = (await import('lighthouse')).default;
        const chromeLauncher = await import('chrome-launcher');
        const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
        const result = await lighthouse(url, {
            port: chrome.port,
            output: 'json',
            onlyCategories: categories,
        });
        await chrome.kill();
        if (!result || !result.lhr) {
            throw new Error('Lighthouse returned no results');
        }
        const lhr = result.lhr;
        const summary = {
            url,
            timestamp: new Date().toISOString(),
            scores: Object.fromEntries(Object.entries(lhr.categories).map(([key, cat]) => [
                key,
                Math.round((cat.score || 0) * 100),
            ])),
            core_web_vitals: {
                LCP: lhr.audits['largest-contentful-paint']?.displayValue || 'N/A',
                FID: lhr.audits['max-potential-fid']?.displayValue || 'N/A',
                CLS: lhr.audits['cumulative-layout-shift']?.displayValue || 'N/A',
                FCP: lhr.audits['first-contentful-paint']?.displayValue || 'N/A',
                TTI: lhr.audits['interactive']?.displayValue || 'N/A',
                TBT: lhr.audits['total-blocking-time']?.displayValue || 'N/A',
            },
            opportunities: Object.values(lhr.audits)
                .filter((a) => {
                const audit = a;
                return audit.details?.type === 'opportunity' && audit.details?.overallSavingsMs;
            })
                .slice(0, 5)
                .map((a) => {
                const audit = a;
                return {
                    title: audit.title,
                    description: audit.description,
                    savings_ms: audit.details?.overallSavingsMs,
                };
            }),
        };
        const reportsDir = path.join(OUTPUT_DIR, 'lighthouse');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        const reportPath = path.join(reportsDir, `lighthouse_${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(lhr, null, 2));
        return JSON.stringify({
            ...summary,
            full_report_saved_to: reportPath,
        }, null, 2);
    }
    catch (error) {
        return JSON.stringify({
            success: false,
            error: error.message,
            hint: 'Lighthouse requires Chrome to be installed on the system',
        }, null, 2);
    }
}
