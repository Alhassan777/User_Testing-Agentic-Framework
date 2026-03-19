import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { OUTPUT_DIR, activeSessions } from '../utils/index.js';
export async function handleVideoStartRecording(args) {
    const url = args.url;
    const sessionName = args.session_name;
    const sessionId = `session_${Date.now()}`;
    try {
        const videosDir = path.join(OUTPUT_DIR, 'videos');
        if (!fs.existsSync(videosDir)) {
            fs.mkdirSync(videosDir, { recursive: true });
        }
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            recordVideo: {
                dir: videosDir,
                size: { width: 1280, height: 720 },
            },
        });
        const page = await context.newPage();
        await page.goto(url);
        const videoPath = path.join(videosDir, `${sessionName}_${sessionId}.webm`);
        activeSessions.set(sessionId, {
            browser,
            context,
            page,
            videoPath,
            startTime: Date.now(),
        });
        return JSON.stringify({
            success: true,
            session_id: sessionId,
            message: `Recording started for ${url}`,
            video_will_be_saved_to: videoPath,
            instructions: 'Use video_stop_recording with this session_id when done',
        }, null, 2);
    }
    catch (error) {
        return JSON.stringify({
            success: false,
            error: error.message,
        }, null, 2);
    }
}
export async function handleVideoStopRecording(args) {
    const sessionId = args.session_id;
    const session = activeSessions.get(sessionId);
    if (!session) {
        return JSON.stringify({
            success: false,
            error: `No active session found with ID: ${sessionId}`,
            active_sessions: Array.from(activeSessions.keys()),
        }, null, 2);
    }
    try {
        await session.page.close();
        await session.context.close();
        const video = session.page.video();
        const actualVideoPath = video ? await video.path() : session.videoPath;
        await session.browser.close();
        activeSessions.delete(sessionId);
        const duration = Date.now() - session.startTime;
        return JSON.stringify({
            success: true,
            session_id: sessionId,
            video_path: actualVideoPath,
            duration_ms: duration,
            duration_formatted: `${Math.floor(duration / 1000)}s`,
        }, null, 2);
    }
    catch (error) {
        return JSON.stringify({
            success: false,
            error: error.message,
        }, null, 2);
    }
}
export async function handleVideoListRecordings() {
    const videosDir = path.join(OUTPUT_DIR, 'videos');
    if (!fs.existsSync(videosDir)) {
        return JSON.stringify({
            videos: [],
            message: 'No recordings yet',
        }, null, 2);
    }
    const files = fs.readdirSync(videosDir)
        .filter(f => f.endsWith('.webm'))
        .map(f => {
        const stats = fs.statSync(path.join(videosDir, f));
        return {
            filename: f,
            path: path.join(videosDir, f),
            size_mb: (stats.size / (1024 * 1024)).toFixed(2),
            created: stats.birthtime.toISOString(),
        };
    });
    return JSON.stringify({
        videos_dir: videosDir,
        count: files.length,
        videos: files,
    }, null, 2);
}
