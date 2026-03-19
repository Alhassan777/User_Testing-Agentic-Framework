import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { OUTPUT_DIR } from '../utils/index.js';
export async function handleRunAutonomousUxTest(args) {
    const url = args.url;
    const credentials = args.credentials;
    const testDuration = args.test_duration_minutes || 5;
    const pagesToTest = args.pages_to_test;
    const testId = `test_${Date.now()}`;
    const testDir = path.join(OUTPUT_DIR, 'tests', testId);
    fs.mkdirSync(testDir, { recursive: true });
    const results = {
        test_id: testId,
        url,
        started_at: new Date().toISOString(),
        pages_visited: [],
        screenshots: [],
        heuristic_findings: [],
        errors: [],
    };
    let browser = null;
    let context = null;
    let page = null;
    try {
        browser = await chromium.launch({ headless: true });
        context = await browser.newContext({
            recordVideo: { dir: testDir, size: { width: 1280, height: 720 } },
            viewport: { width: 1280, height: 720 },
        });
        page = await context.newPage();
        const takeScreenshot = async (name) => {
            const screenshotPath = path.join(testDir, `${name}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            results.screenshots.push(screenshotPath);
            return screenshotPath;
        };
        const analyzePage = async (pageName) => {
            const pageUrl = page.url();
            results.pages_visited.push(pageUrl);
            await takeScreenshot(`page_${results.pages_visited.length}_${pageName}`);
            const findings = [];
            const formsWithoutValidation = await page.$$eval('form', forms => forms.filter(f => !f.querySelector('[required]') && f.querySelectorAll('input').length > 0).length);
            if (formsWithoutValidation > 0) {
                findings.push({
                    heuristic: 'H5: Error Prevention',
                    severity: 'medium',
                    issue: `${formsWithoutValidation} form(s) without required field validation`,
                    page: pageUrl,
                });
            }
            const hasHelp = await page.$('a[href*="help"], a[href*="docs"], a[href*="support"], [aria-label*="help"]') !== null;
            if (!hasHelp) {
                findings.push({
                    heuristic: 'H10: Help and Documentation',
                    severity: 'low',
                    issue: 'No visible help or documentation link found',
                    page: pageUrl,
                });
            }
            const imagesWithoutAlt = await page.$$eval('img', imgs => imgs.filter(img => !img.alt || img.alt.trim() === '').length);
            if (imagesWithoutAlt > 0) {
                findings.push({
                    heuristic: 'Accessibility',
                    severity: 'high',
                    issue: `${imagesWithoutAlt} image(s) missing alt text`,
                    page: pageUrl,
                });
            }
            const clickableWithoutLabel = await page.$$eval('button, a', els => els.filter(el => !el.textContent?.trim() && !el.getAttribute('aria-label') && !el.getAttribute('title')).length);
            if (clickableWithoutLabel > 0) {
                findings.push({
                    heuristic: 'Accessibility',
                    severity: 'medium',
                    issue: `${clickableWithoutLabel} clickable element(s) without accessible labels`,
                    page: pageUrl,
                });
            }
            results.heuristic_findings.push(...findings);
            return { url: pageUrl, findings };
        };
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        await analyzePage('landing');
        if (credentials?.email && credentials?.password) {
            const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
            const passwordInput = await page.$('input[type="password"], input[name="password"]');
            const loginButton = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), input[type="submit"]');
            if (emailInput && passwordInput && loginButton) {
                await emailInput.fill(credentials.email);
                await passwordInput.fill(credentials.password);
                await takeScreenshot('login_filled');
                await loginButton.click();
                await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => { });
                await takeScreenshot('after_login');
                await analyzePage('after_login');
            }
        }
        const visitedUrls = new Set([page.url()]);
        const urlsToVisit = pagesToTest || [];
        if (!pagesToTest) {
            const discoveredLinks = await page.$$eval('a[href]', (els, baseUrl) => els
                .map(e => e.getAttribute('href'))
                .filter(href => href && !href.startsWith('#') && !href.startsWith('javascript:'))
                .map(href => { try {
                return new URL(href, baseUrl).href;
            }
            catch {
                return null;
            } })
                .filter(Boolean), url);
            const baseHost = new URL(url).host;
            urlsToVisit.push(...discoveredLinks.filter(u => {
                try {
                    return new URL(u).host === baseHost && !visitedUrls.has(u);
                }
                catch {
                    return false;
                }
            }).slice(0, 10));
        }
        for (const targetUrl of urlsToVisit) {
            if (visitedUrls.has(targetUrl))
                continue;
            visitedUrls.add(targetUrl);
            try {
                await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
                const pageName = new URL(targetUrl).pathname.replace(/\//g, '_') || 'page';
                await analyzePage(pageName);
            }
            catch (e) {
                results.errors.push(`Failed to visit ${targetUrl}: ${e.message}`);
            }
            const elapsed = Date.now() - new Date(results.started_at).getTime();
            if (elapsed > testDuration * 60 * 1000)
                break;
        }
        try {
            const lighthouse = (await import('lighthouse')).default;
            const chromeLauncher = await import('chrome-launcher');
            const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
            const lhResult = await lighthouse(url, {
                port: chrome.port,
                output: 'json',
                onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
            });
            await chrome.kill();
            if (lhResult?.lhr) {
                results.lighthouse = {
                    scores: Object.fromEntries(Object.entries(lhResult.lhr.categories).map(([key, cat]) => [
                        key,
                        Math.round((cat.score || 0) * 100),
                    ])),
                    core_web_vitals: {
                        LCP: lhResult.lhr.audits['largest-contentful-paint']?.displayValue,
                        FID: lhResult.lhr.audits['max-potential-fid']?.displayValue,
                        CLS: lhResult.lhr.audits['cumulative-layout-shift']?.displayValue,
                    },
                };
            }
        }
        catch (e) {
            results.errors.push(`Lighthouse failed: ${e.message}`);
        }
        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            const axeBuilder = new AxeBuilder({ page }).withTags(['wcag21aa']);
            const axeResults = await axeBuilder.analyze();
            results.accessibility = {
                violations: axeResults.violations.length,
                passes: axeResults.passes.length,
                top_violations: axeResults.violations.slice(0, 5).map(v => ({
                    id: v.id,
                    impact: v.impact,
                    description: v.description,
                    nodes_affected: v.nodes.length,
                })),
            };
        }
        catch (e) {
            results.errors.push(`Accessibility scan failed: ${e.message}`);
        }
        await page.close();
        const video = page.video();
        if (video) {
            results.video_path = await video.path();
        }
        await context.close();
        await browser.close();
        results.ended_at = new Date().toISOString();
        results.duration_ms = Date.now() - new Date(results.started_at).getTime();
        const reportPath = path.join(testDir, 'report.json');
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        return JSON.stringify({
            success: true,
            test_id: testId,
            test_directory: testDir,
            summary: {
                url,
                duration: `${Math.round((results.duration_ms || 0) / 1000)}s`,
                pages_visited: results.pages_visited.length,
                screenshots_captured: results.screenshots.length,
                video_recorded: !!results.video_path,
                heuristic_findings: results.heuristic_findings.length,
                errors: results.errors.length,
            },
            lighthouse_scores: results.lighthouse,
            accessibility: results.accessibility,
            heuristic_findings: results.heuristic_findings,
            pages_visited: results.pages_visited,
            screenshots: results.screenshots,
            video_path: results.video_path,
            full_report: reportPath,
            errors: results.errors.length > 0 ? results.errors : undefined,
        }, null, 2);
    }
    catch (error) {
        if (page)
            await page.close().catch(() => { });
        if (context)
            await context.close().catch(() => { });
        if (browser)
            await browser.close().catch(() => { });
        return JSON.stringify({
            success: false,
            test_id: testId,
            error: error.message,
            partial_results: results,
        }, null, 2);
    }
}
