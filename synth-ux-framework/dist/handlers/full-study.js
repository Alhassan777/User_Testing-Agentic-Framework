import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { OUTPUT_DIR } from '../utils/index.js';
import { renderAnnotationOutputs } from '../figma/index.js';
import { StateMachine, ArtifactManager, ResourceManager } from '../orchestrator/index.js';
import { evaluateHeuristics, analyzeFirstClick, generateAppBrief, generatePersonas, analyzeJTBD, discoverCompetitors, deriveTaskList, classifyProblemSeverity, simulateSession, generateDesignAudit, generateCompetitorComparison, conductInterview, performDualCoding, generateSegmentHeatMap, generateAnalysis, generateCalibrationReport, generateABHypotheses, extractClips, buildClipLibrary, generateWeeklyDigest, analyzeTimeMetrics, generateInsights, generateFigmaAnnotations, } from '../ai-executor.js';
export async function handleRunFullUxStudy(args) {
    const url = args.url;
    const appName = args.app_name;
    const appDescription = args.app_description;
    const credentials = args.credentials;
    const personaCount = args.persona_count || 5;
    const studyId = `study_${Date.now()}`;
    const studyDir = path.join(OUTPUT_DIR, 'studies', studyId);
    fs.mkdirSync(studyDir, { recursive: true });
    const screenshotsDir = path.join(studyDir, 'screenshots');
    const videosDir = path.join(studyDir, 'videos');
    const clipsDir = path.join(studyDir, 'clips');
    fs.mkdirSync(screenshotsDir, { recursive: true });
    fs.mkdirSync(videosDir, { recursive: true });
    fs.mkdirSync(clipsDir, { recursive: true });
    const stateMachine = new StateMachine();
    const artifactManager = new ArtifactManager(studyDir);
    const resourceManager = new ResourceManager();
    const log = (msg, phase) => {
        const phaseLabel = phase ? `[${phase}]` : '';
        const entry = `[${new Date().toISOString()}]${phaseLabel} ${msg}`;
        fs.appendFileSync(path.join(studyDir, 'progress.log'), entry + '\n');
    };
    const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    log(`Starting full orchestrated UX study for ${appName} at ${url}`);
    log(`State machine initialized: ${stateMachine.getPhase()}`);
    let browser = null;
    let context = null;
    let page = null;
    let studyVideoPath = null;
    const visualCaptures = [];
    const capture = async (label) => {
        if (!page)
            return '';
        const filePath = path.join(screenshotsDir, `${slug(label)}.png`);
        await page.screenshot({ path: filePath, fullPage: true });
        visualCaptures.push({ label, url: page.url(), path: filePath });
        return filePath;
    };
    try {
        // ═══════════════════════════════════════════════════════════════════
        // PHASE 0: PRE-TESTING
        // ═══════════════════════════════════════════════════════════════════
        await stateMachine.transition('pre_testing', 'Starting Phase 0: Pre-Testing');
        log('Starting Phase 0: Pre-Testing', 'PHASE_0');
        browser = await chromium.launch({ headless: true });
        context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            recordVideo: { dir: videosDir, size: { width: 1280, height: 720 } },
        });
        resourceManager.register({ type: 'browser_context', id: 'main' }, async () => {
            if (context)
                await context.close();
            if (browser)
                await browser.close();
        });
        page = await context.newPage();
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        const landingScreenshot = await capture('landing');
        log('Captured landing page screenshot', 'PHASE_0');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const landingText = await page.evaluate(
        // @ts-ignore
        () => { const b = document.body.cloneNode(true); b.querySelectorAll('script,style,noscript').forEach(e => e.remove()); return b.innerText.substring(0, 4000); });
        // Heuristic Evaluation
        log('Running heuristic evaluation...', 'PHASE_0');
        let heuristicEval = null;
        try {
            heuristicEval = await evaluateHeuristics(url, landingText, [`Landing page screenshot at ${landingScreenshot}`]);
            artifactManager.set('hypothesisList', {
                hypotheses: heuristicEval.hypothesis_list.map(h => ({
                    id: h.id, heuristic: h.heuristic_source, hypothesis: h.hypothesis, severity: h.severity, testable: h.testable,
                })),
            });
            fs.writeFileSync(path.join(studyDir, 'heuristic_evaluation.json'), JSON.stringify(heuristicEval, null, 2));
            log(`Heuristic evaluation complete: ${heuristicEval.hypothesis_list.length} hypotheses`, 'PHASE_0');
        }
        catch (e) {
            log(`Heuristic evaluation failed (non-fatal): ${e.message}`, 'PHASE_0');
        }
        // First-Click Analysis
        log('Running first-click analysis...', 'PHASE_0');
        let firstClickAnalysis = null;
        try {
            const coreTasksForFirstClick = ['Create an account / Sign up', 'Find pricing information', 'Learn what the product does', 'Contact support or get help'];
            firstClickAnalysis = await analyzeFirstClick([{ url, content: landingText, screenshot: landingScreenshot }], coreTasksForFirstClick);
            artifactManager.set('informationScent', firstClickAnalysis);
            fs.writeFileSync(path.join(studyDir, 'first_click_analysis.json'), JSON.stringify(firstClickAnalysis, null, 2));
            log(`First-click analysis complete: scent score ${firstClickAnalysis.information_scent_score}`, 'PHASE_0');
        }
        catch (e) {
            log(`First-click analysis failed (non-fatal): ${e.message}`, 'PHASE_0');
        }
        // Handle login
        if (credentials?.email && credentials?.password) {
            log('Attempting login...', 'PHASE_0');
            const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
            const passwordInput = await page.$('input[type="password"]');
            const loginButton = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), input[type="submit"]');
            if (emailInput && passwordInput && loginButton) {
                await emailInput.fill(credentials.email);
                await passwordInput.fill(credentials.password);
                await loginButton.click();
                await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => { });
                await capture('after_login');
                log('Login completed', 'PHASE_0');
            }
        }
        // Capture additional screens
        log('Capturing additional key screens...', 'PHASE_0');
        const discoveredLinks = await page.$$eval('a[href]', (anchors, currentUrl) => {
            const links = anchors.map(a => a.getAttribute('href')).filter((href) => !!href && !href.startsWith('#') && !href.startsWith('javascript:'));
            return links.map(href => { try {
                return new URL(href, currentUrl).href;
            }
            catch {
                return null;
            } }).filter((href) => !!href);
        }, page.url());
        const baseHost = new URL(url).host;
        const uniqueSameHostLinks = Array.from(new Set(discoveredLinks)).filter(link => { try {
            return new URL(link).host === baseHost;
        }
        catch {
            return false;
        } }).slice(0, 6);
        const navigationLinks = [];
        for (const target of uniqueSameHostLinks) {
            try {
                await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 });
                await capture(`screen_${new URL(target).pathname || '/'}`);
                navigationLinks.push(target);
            }
            catch (e) {
                log(`Screen capture skipped for ${target}: ${e.message}`, 'PHASE_0');
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const appPageText = await page.evaluate(
        // @ts-ignore
        () => { const b = document.body.cloneNode(true); b.querySelectorAll('script,style,noscript').forEach(e => e.remove()); return b.innerText.substring(0, 4000); });
        const appPageUrl = page.url();
        // ═══════════════════════════════════════════════════════════════════
        // PHASE 1: INTELLIGENCE
        // ═══════════════════════════════════════════════════════════════════
        await stateMachine.transition('intelligence', 'Starting Phase 1: Intelligence');
        log('Starting Phase 1: Intelligence', 'PHASE_1');
        // Lighthouse
        log('Running Lighthouse audit...', 'PHASE_1');
        let lighthouseData = null;
        try {
            const lighthouse = (await import('lighthouse')).default;
            const chromeLauncher = await import('chrome-launcher');
            const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
            const lhResult = await lighthouse(url, { port: chrome.port, output: 'json', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] });
            await chrome.kill();
            if (lhResult?.lhr) {
                lighthouseData = {
                    scores: Object.fromEntries(Object.entries(lhResult.lhr.categories).map(([key, cat]) => [key, Math.round((cat.score || 0) * 100)])),
                    core_web_vitals: { LCP: lhResult.lhr.audits['largest-contentful-paint']?.displayValue, CLS: lhResult.lhr.audits['cumulative-layout-shift']?.displayValue, FCP: lhResult.lhr.audits['first-contentful-paint']?.displayValue, TTI: lhResult.lhr.audits['interactive']?.displayValue },
                };
            }
            log('Lighthouse complete', 'PHASE_1');
        }
        catch (e) {
            log(`Lighthouse failed (non-fatal): ${e.message}`, 'PHASE_1');
            lighthouseData = { error: e.message };
        }
        // Accessibility
        log('Running accessibility scan...', 'PHASE_1');
        let accessibilityData = null;
        try {
            const axeContext = await browser.newContext();
            const axePage = await axeContext.newPage();
            await axePage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            const axeBuilder = new AxeBuilder({ page: axePage }).withTags(['wcag21aa']);
            const axeResults = await axeBuilder.analyze();
            await axeContext.close();
            accessibilityData = {
                violations: axeResults.violations.length,
                passes: axeResults.passes.length,
                top_violations: axeResults.violations.slice(0, 5).map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes_affected: v.nodes.length })),
            };
            log('Accessibility scan complete', 'PHASE_1');
        }
        catch (e) {
            log(`Accessibility scan failed (non-fatal): ${e.message}`, 'PHASE_1');
            accessibilityData = { error: e.message };
        }
        // App Brief
        log('Generating app brief...', 'PHASE_1');
        let appBrief = null;
        try {
            appBrief = await generateAppBrief(url, landingText, navigationLinks, visualCaptures.map(v => v.label));
            artifactManager.set('appBrief', appBrief);
            fs.writeFileSync(path.join(studyDir, 'app_brief.json'), JSON.stringify(appBrief, null, 2));
            log('App brief generated', 'PHASE_1');
        }
        catch (e) {
            log(`App brief generation failed (non-fatal): ${e.message}`, 'PHASE_1');
        }
        // JTBD
        log('Analyzing Jobs-to-Be-Done...', 'PHASE_1');
        const jtbd = await analyzeJTBD(appDescription, landingText);
        artifactManager.set('jtbd', jtbd);
        fs.writeFileSync(path.join(studyDir, 'jtbd.json'), JSON.stringify(jtbd, null, 2));
        log('JTBD analysis complete', 'PHASE_1');
        // Competitors
        log('Discovering competitors and alternatives...', 'PHASE_1');
        const competitors = await discoverCompetitors(appName, appDescription, landingText, 5);
        artifactManager.set('competitors', competitors);
        fs.writeFileSync(path.join(studyDir, 'competitors.json'), JSON.stringify(competitors, null, 2));
        log(`Competitor discovery complete: ${competitors.length} identified`, 'PHASE_1');
        // Personas
        log(`Generating ${personaCount} personas...`, 'PHASE_1');
        const appContext = `App Name: ${appName}\nDescription: ${appDescription}\nURL: ${url}\nLanding page content:\n${landingText}`;
        const personas = await generatePersonas(appContext, personaCount);
        artifactManager.set('personas', personas);
        fs.writeFileSync(path.join(studyDir, 'personas.json'), JSON.stringify(personas, null, 2));
        log(`Generated ${personas.length} personas`, 'PHASE_1');
        // ═══════════════════════════════════════════════════════════════════
        // PHASE 2: DERIVATION
        // ═══════════════════════════════════════════════════════════════════
        await stateMachine.transition('derivation', 'Starting Phase 2: Derivation');
        log('Starting Phase 2: Derivation', 'PHASE_2');
        log('Deriving task list...', 'PHASE_2');
        let taskList = null;
        try {
            if (appBrief) {
                taskList = await deriveTaskList(appBrief, personas, jtbd);
                artifactManager.set('taskList', taskList);
                fs.writeFileSync(path.join(studyDir, 'task_list.json'), JSON.stringify(taskList, null, 2));
                log(`Task list derived: ${taskList.tasks.length} tasks`, 'PHASE_2');
            }
        }
        catch (e) {
            log(`Task derivation failed (non-fatal): ${e.message}`, 'PHASE_2');
        }
        // Close browser
        const pageVideo = page.video();
        await page.close();
        await context.close();
        if (pageVideo) {
            studyVideoPath = await pageVideo.path();
            log(`Session video saved: ${studyVideoPath}`, 'PHASE_2');
        }
        await browser.close();
        browser = null;
        // ═══════════════════════════════════════════════════════════════════
        // PHASE 3: EXECUTION
        // ═══════════════════════════════════════════════════════════════════
        await stateMachine.transition('execution', 'Starting Phase 3: Execution');
        log('Starting Phase 3: Execution', 'PHASE_3');
        const sessions = [];
        const interviews = [];
        const highlights = [];
        const timeMetricsList = [];
        const tasks = taskList?.tasks.map(t => t.task) || [
            'Understand what the product does and who it is for',
            'Find and complete the primary action (sign up / start using)',
            'Explore the main features',
            'Find pricing or commitment information',
            'Determine if you would use this product and why',
        ];
        for (const persona of personas) {
            log(`Simulating session for ${persona.name}...`, 'PHASE_3');
            const session = await simulateSession(persona, appPageText, appPageUrl, tasks);
            sessions.push(session);
            artifactManager.persistSession(persona.id, session);
            const optimalSteps = taskList?.tasks.reduce((sum, t) => sum + t.success_criteria.optimal_path_steps, 0) || 10;
            const timeMetrics = await analyzeTimeMetrics(session, optimalSteps);
            timeMetricsList.push(timeMetrics);
            fs.writeFileSync(path.join(studyDir, `time_metrics_${persona.id}.json`), JSON.stringify(timeMetrics, null, 2));
            log(`Time metrics for ${persona.name}: TTFMA=${timeMetrics.ttfma_seconds}s, hesitations=${timeMetrics.hesitation_events.length}`, 'PHASE_3');
            // Extract highlights
            const flaggedAction = session.actions.find(a => !!a.ux_flag && ['critical', 'major', 'high'].includes((a.severity || '').toLowerCase())) || session.actions.find(a => !!a.ux_flag);
            if (flaggedAction) {
                highlights.push({
                    id: `${persona.id}_friction`, persona_id: persona.id, persona_name: persona.name, type: 'friction',
                    severity: (flaggedAction.severity?.toLowerCase() === 'critical' ? 'critical' : flaggedAction.severity?.toLowerCase() === 'major' || flaggedAction.severity?.toLowerCase() === 'high' ? 'high' : flaggedAction.severity?.toLowerCase() === 'minor' || flaggedAction.severity?.toLowerCase() === 'low' ? 'low' : 'medium'),
                    title: `Primary friction for ${persona.name}`, evidence: flaggedAction.narration, source: `session_${persona.id}.json`, screenshot: landingScreenshot,
                });
            }
            if (session.aha_moment?.occurred && session.aha_moment.quote) {
                highlights.push({
                    id: `${persona.id}_aha`, persona_id: persona.id, persona_name: persona.name, type: 'aha', severity: 'medium',
                    title: `Aha moment for ${persona.name}`, evidence: session.aha_moment.quote, source: `session_${persona.id}.json`, screenshot: landingScreenshot,
                });
            }
            log(`Conducting interview for ${persona.name}...`, 'PHASE_3');
            const sessionSummary = `Persona: ${persona.name} (${persona.role})\nFriction points: ${session.friction_points.join('; ')}\nDelight moments: ${session.delight_moments.join('; ')}\nAha moment: ${session.aha_moment?.occurred ? session.aha_moment.quote : 'None'}\nKey actions taken: ${session.actions.slice(0, 5).map(a => a.narration).join(' | ')}\nTime metrics: TTFMA=${timeMetrics.ttfma_seconds}s, ${timeMetrics.hesitation_events.length} hesitations`.trim();
            const interview = await conductInterview(persona, sessionSummary);
            interviews.push(interview);
            artifactManager.persistInterview(persona.id, interview);
            const commitmentQuestion = interview.questions.find(q => /commit to using regularly/i.test(q.question));
            if (commitmentQuestion?.answer) {
                highlights.push({
                    id: `${persona.id}_quote`, persona_id: persona.id, persona_name: persona.name, type: 'quote', severity: 'medium',
                    title: `Commitment blocker quote from ${persona.name}`, evidence: commitmentQuestion.answer, source: `interview_${persona.id}.json`, screenshot: landingScreenshot,
                });
            }
            log(`Completed interview for ${persona.name}`, 'PHASE_3');
        }
        // Design Audit
        log('Generating design audit...', 'PHASE_3');
        let designAudit = null;
        try {
            designAudit = await generateDesignAudit(appPageText, accessibilityData, visualCaptures.map(v => v.label));
            artifactManager.set('designAudit', designAudit);
            fs.writeFileSync(path.join(studyDir, 'design_audit.json'), JSON.stringify(designAudit, null, 2));
            log(`Design audit complete: total score ${designAudit.overall_score.total}`, 'PHASE_3');
        }
        catch (e) {
            log(`Design audit failed (non-fatal): ${e.message}`, 'PHASE_3');
        }
        // ═══════════════════════════════════════════════════════════════════
        // PHASE 4: ANALYSIS
        // ═══════════════════════════════════════════════════════════════════
        await stateMachine.transition('analysis', 'Starting Phase 4: Analysis');
        log('Starting Phase 4: Analysis', 'PHASE_4');
        log('Classifying problem severity...', 'PHASE_4');
        let problemSeverity = null;
        try {
            problemSeverity = await classifyProblemSeverity(personas, sessions, interviews);
            artifactManager.set('problemSeverity', problemSeverity);
            fs.writeFileSync(path.join(studyDir, 'problem_severity.json'), JSON.stringify(problemSeverity, null, 2));
            log(`Problem severity classified: ${problemSeverity.pmf_readiness}`, 'PHASE_4');
        }
        catch (e) {
            log(`Problem severity classification failed (non-fatal): ${e.message}`, 'PHASE_4');
        }
        log('Performing dual coding analysis...', 'PHASE_4');
        let dualCoding = null;
        try {
            dualCoding = await performDualCoding(sessions, interviews);
            artifactManager.set('codedObservations', dualCoding);
            fs.writeFileSync(path.join(studyDir, 'dual_coding.json'), JSON.stringify(dualCoding, null, 2));
            log(`Dual coding complete: ${dualCoding.themes.length} themes, kappa=${dualCoding.cohens_kappa}`, 'PHASE_4');
        }
        catch (e) {
            log(`Dual coding failed (non-fatal): ${e.message}`, 'PHASE_4');
        }
        log('Generating segment heat map...', 'PHASE_4');
        let segmentHeatMap = null;
        try {
            if (problemSeverity) {
                segmentHeatMap = await generateSegmentHeatMap(personas, problemSeverity, sessions, interviews);
                artifactManager.set('segments', segmentHeatMap);
                fs.writeFileSync(path.join(studyDir, 'segment_heat_map.json'), JSON.stringify(segmentHeatMap, null, 2));
                log(`Segment heat map: best PMF opportunity = ${segmentHeatMap.best_pmf_opportunity.substring(0, 50)}...`, 'PHASE_4');
            }
        }
        catch (e) {
            log(`Segment heat map failed (non-fatal): ${e.message}`, 'PHASE_4');
        }
        log('Generating comprehensive analysis...', 'PHASE_4');
        let analysisResult = null;
        try {
            analysisResult = await generateAnalysis(personas, sessions, interviews, jtbd, problemSeverity || { personas: [], distribution: { level_4_hair_on_fire: 0, level_3_painful: 0, level_2_aware: 0, level_1_latent: 0 }, pmf_readiness: 'Unknown' }, dualCoding || { themes: [], cohens_kappa: 0, reliability_rating: 'poor', disagreements: [], saturation_reached: false }, designAudit, competitors);
            artifactManager.set('analysis', analysisResult);
            fs.writeFileSync(path.join(studyDir, 'analysis.json'), JSON.stringify(analysisResult, null, 2));
            log(`Analysis complete: SUS=${analysisResult.sus_score}, PMF probability=${analysisResult.pmf_signals.pmf_probability}%`, 'PHASE_4');
        }
        catch (e) {
            log(`Full analysis failed (non-fatal): ${e.message}`, 'PHASE_4');
        }
        log('Generating calibration report...', 'PHASE_4');
        let calibrationReport = null;
        try {
            if (analysisResult) {
                calibrationReport = await generateCalibrationReport(sessions, interviews, analysisResult);
                artifactManager.set('calibration', calibrationReport);
                fs.writeFileSync(path.join(studyDir, 'calibration.json'), JSON.stringify(calibrationReport, null, 2));
                log(`Calibration report: internal validity=${calibrationReport.internal_validity}%`, 'PHASE_4');
            }
        }
        catch (e) {
            log(`Calibration report failed (non-fatal): ${e.message}`, 'PHASE_4');
        }
        log('Generating A/B test hypotheses...', 'PHASE_4');
        let abHypotheses = null;
        try {
            if (analysisResult && appBrief) {
                abHypotheses = await generateABHypotheses(analysisResult, appBrief);
                artifactManager.set('abHypotheses', abHypotheses);
                fs.writeFileSync(path.join(studyDir, 'ab_hypotheses.json'), JSON.stringify(abHypotheses, null, 2));
                log(`A/B hypotheses: ${abHypotheses.hypotheses.length} generated`, 'PHASE_4');
            }
        }
        catch (e) {
            log(`A/B hypotheses failed (non-fatal): ${e.message}`, 'PHASE_4');
        }
        // ═══════════════════════════════════════════════════════════════════
        // PHASE 5: CLIPS
        // ═══════════════════════════════════════════════════════════════════
        await stateMachine.transition('clips', 'Starting Phase 5: Clips');
        log('Starting Phase 5: Clips', 'PHASE_5');
        let clips = [];
        let clipLibrary = null;
        try {
            log('Extracting clips from sessions...', 'PHASE_5');
            clips = await extractClips(sessions, interviews, personas, studyVideoPath || '');
            fs.writeFileSync(path.join(studyDir, 'clips.json'), JSON.stringify(clips, null, 2));
            log(`Extracted ${clips.length} clips`, 'PHASE_5');
            clipLibrary = await buildClipLibrary(clips, sessions);
            artifactManager.set('clips', clips);
            fs.writeFileSync(path.join(studyDir, 'clip_library.json'), JSON.stringify(clipLibrary, null, 2));
            log(`Clip library built: ${clipLibrary.total_clips} clips, ${clipLibrary.total_duration_minutes} minutes`, 'PHASE_5');
        }
        catch (e) {
            log(`Clip extraction failed (non-fatal): ${e.message}`, 'PHASE_5');
        }
        let weeklyDigest = null;
        try {
            if (clipLibrary && analysisResult) {
                const weekLabel = new Date().toISOString().split('T')[0].substring(0, 7) + '-W' + Math.ceil(new Date().getDate() / 7);
                weeklyDigest = await generateWeeklyDigest(clipLibrary, analysisResult, weekLabel);
                artifactManager.set('weeklyDigest', weeklyDigest);
                fs.writeFileSync(path.join(studyDir, 'weekly_digest.json'), JSON.stringify(weeklyDigest, null, 2));
                log('Weekly Voice of User digest generated', 'PHASE_5');
            }
        }
        catch (e) {
            log(`Weekly digest failed (non-fatal): ${e.message}`, 'PHASE_5');
        }
        // ═══════════════════════════════════════════════════════════════════
        // PHASE 6: OUTPUT
        // ═══════════════════════════════════════════════════════════════════
        await stateMachine.transition('output', 'Starting Phase 6: Output');
        log('Starting Phase 6: Output', 'PHASE_6');
        log('Generating competitor comparison report...', 'PHASE_6');
        const competitorComparison = await generateCompetitorComparison(appName, appDescription, competitors, personas, sessions, interviews, jtbd);
        fs.writeFileSync(path.join(studyDir, 'COMPETITOR_COMPARISON.md'), competitorComparison);
        log('Competitor comparison saved', 'PHASE_6');
        fs.writeFileSync(path.join(studyDir, 'highlights.json'), JSON.stringify(highlights, null, 2));
        fs.writeFileSync(path.join(studyDir, 'figma_handoff_highlights.json'), JSON.stringify({
            generated_at: new Date().toISOString(),
            note: 'Figma-ready structured cards for manual import or MCP automation.',
            cards: highlights.map(h => ({ id: h.id, title: h.title, persona: h.persona_name, type: h.type, severity: h.severity, evidence: h.evidence, screenshot: h.screenshot, source: h.source })),
        }, null, 2));
        try {
            log('Running vision-based screenshot annotation...', 'PHASE_6');
            const figmaAnnotations = await generateFigmaAnnotations(appName, visualCaptures, highlights);
            fs.writeFileSync(path.join(studyDir, 'figma_annotations.json'), JSON.stringify(figmaAnnotations, null, 2));
            log(`Vision annotations generated: ${figmaAnnotations.annotations.length} findings placed on screenshots`, 'PHASE_6');
            const { annotatedHtmlPaths, pluginDataPath } = renderAnnotationOutputs(figmaAnnotations, studyDir);
            log(`Annotated screenshots: ${annotatedHtmlPaths.length} HTML files → ${path.join(studyDir, 'annotated_screenshots/')}`, 'PHASE_6');
            log(`Figma plugin data: ${pluginDataPath}`, 'PHASE_6');
        }
        catch (e) {
            log(`Figma annotation generation failed (non-fatal): ${e.message}`, 'PHASE_6');
        }
        log('Generating insights report...', 'PHASE_6');
        const insightsMarkdown = await generateInsights(appName, personas, sessions, interviews, jtbd, lighthouseData, accessibilityData, {
            competitors, competitor_comparison_summary: competitorComparison.substring(0, 2000), highlights, visual_captures: visualCaptures, study_video_path: studyVideoPath,
            heuristic_evaluation: heuristicEval, first_click_analysis: firstClickAnalysis, analysis: analysisResult, calibration: calibrationReport, ab_hypotheses: abHypotheses, segment_heat_map: segmentHeatMap, weekly_digest: weeklyDigest,
        });
        fs.writeFileSync(path.join(studyDir, 'INSIGHTS_REPORT.md'), insightsMarkdown);
        log('Insights report saved', 'PHASE_6');
        // ═══════════════════════════════════════════════════════════════════
        // COMPLETE
        // ═══════════════════════════════════════════════════════════════════
        await stateMachine.transition('complete', 'Study complete');
        log(`Study complete! Progress: ${stateMachine.getProgressPercentage()}%`, 'COMPLETE');
        const pmfScore = interviews.filter(i => i.sean_ellis_score === 'very_disappointed').length / interviews.length;
        const ahaRate = sessions.filter(s => s.aha_moment?.occurred).length / sessions.length;
        const fullResults = {
            study_id: studyId, app_name: appName, url, completed_at: new Date().toISOString(),
            llm_provider: process.env.GEMINI_API_KEY ? 'Gemini' : 'Anthropic', personas_count: personas.length,
            orchestration: { phases_completed: stateMachine.getHistory().map(t => ({ from: t.from, to: t.to, timestamp: t.timestamp })), progress_percentage: stateMachine.getProgressPercentage() },
            pmf_signal: { sean_ellis_score: `${Math.round(pmfScore * 100)}% very disappointed`, aha_moment_rate: `${Math.round(ahaRate * 100)}%`, pmf_threshold_met: pmfScore >= 0.4, pmf_probability: analysisResult?.pmf_signals.pmf_probability || 0 },
            sus_score: analysisResult?.sus_score,
            time_metrics_summary: { avg_ttfma: timeMetricsList.reduce((sum, t) => sum + t.ttfma_seconds, 0) / timeMetricsList.length, total_hesitations: timeMetricsList.reduce((sum, t) => sum + t.hesitation_events.length, 0), avg_efficiency: timeMetricsList.reduce((sum, t) => sum + t.efficiency_score, 0) / timeMetricsList.length },
            lighthouse: lighthouseData, accessibility: accessibilityData, artifacts: artifactManager.getArtifactPaths(),
        };
        fs.writeFileSync(path.join(studyDir, 'full_results.json'), JSON.stringify(fullResults, null, 2));
        log('Full results bundle saved', 'COMPLETE');
        return JSON.stringify({
            success: true, study_id: studyId, study_directory: studyDir,
            orchestration_status: { phase: stateMachine.getPhase(), progress: `${stateMachine.getProgressPercentage()}%`, phases_completed: stateMachine.getHistory().length },
            pmf_signal: fullResults.pmf_signal, sus_score: fullResults.sus_score, time_metrics: fullResults.time_metrics_summary, lighthouse_scores: lighthouseData,
            accessibility_violations: accessibilityData?.violations, personas_tested: personas.map(p => ({ id: p.id, name: p.name, role: p.role })),
            competitors_identified: competitors.length, clips_extracted: clips.length, screenshots_captured: visualCaptures.length, video_recorded: !!studyVideoPath,
            artifacts: { insights_report: path.join(studyDir, 'INSIGHTS_REPORT.md'), competitor_comparison: path.join(studyDir, 'COMPETITOR_COMPARISON.md'), analysis: path.join(studyDir, 'analysis.json'), ab_hypotheses: path.join(studyDir, 'ab_hypotheses.json'), segment_heat_map: path.join(studyDir, 'segment_heat_map.json'), clip_library: path.join(studyDir, 'clip_library.json'), weekly_digest: path.join(studyDir, 'weekly_digest.json'), figma_annotations: path.join(studyDir, 'figma_annotations.json'), annotated_screenshots: path.join(studyDir, 'annotated_screenshots'), full_results: path.join(studyDir, 'full_results.json') },
            message: `Full orchestrated UX study complete. Read INSIGHTS_REPORT.md for findings.`,
        }, null, 2);
    }
    catch (error) {
        await resourceManager.cleanup();
        await stateMachine.enterErrorState(error);
        log(`Study failed in phase ${stateMachine.getPhase()}: ${error.message}`, 'ERROR');
        return JSON.stringify({
            success: false, study_id: studyId, study_directory: studyDir,
            phase_failed: stateMachine.getHistory()[stateMachine.getHistory().length - 2]?.to || 'init',
            error: error.message, can_retry: stateMachine.canRetry(),
            hint: 'Check progress.log in the study directory for details. Ensure GEMINI_API_KEY or ANTHROPIC_API_KEY is set.',
        }, null, 2);
    }
}
