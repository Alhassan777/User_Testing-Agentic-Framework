import { Browser, BrowserContext, Page } from 'playwright';

export interface RecordingSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  videoPath: string;
  startTime: number;
}

export const activeSessions: Map<string, RecordingSession> = new Map();
