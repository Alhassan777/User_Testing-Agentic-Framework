import fs from 'fs';
import path from 'path';

/**
 * Flexible artifact manager that stores any JSON-serializable data.
 * Uses dynamic keys to avoid tight coupling with specific type structures.
 */
export class ArtifactManager {
  private artifacts: Map<string, unknown> = new Map();
  private studyDir: string;
  
  private filenameMap: Record<string, string> = {
    hypothesisList: 'hypothesis_list.json',
    informationScent: 'information_scent.json',
    appBrief: 'app_brief.json',
    competitors: 'competitors.json',
    personas: 'personas.json',
    jtbd: 'jtbd.json',
    taskList: 'task_list.json',
    problemSeverity: 'problem_severity.json',
    sessions: 'sessions.json',
    competitorTraces: 'competitor_traces.json',
    designAudit: 'design_audit.json',
    reflections: 'reflections.json',
    codedObservations: 'coded_observations.json',
    analysis: 'analysis.json',
    segments: 'segment_heat_map.json',
    clips: 'clips.json',
    report: 'report.json',
    calibration: 'calibration.json',
    abHypotheses: 'ab_hypotheses.json',
    weeklyDigest: 'weekly_digest.json',
  };

  constructor(studyDir: string) {
    this.studyDir = studyDir;
  }

  getArtifacts(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of this.artifacts) {
      result[key] = value;
    }
    return result;
  }

  set(key: string, value: unknown): void {
    this.artifacts.set(key, value);
    this.persist(key, value);
  }

  get<T = unknown>(key: string): T | null {
    return (this.artifacts.get(key) as T) ?? null;
  }

  private persist(key: string, value: unknown): void {
    if (value === null || value === undefined) return;
    
    const filename = this.getFilename(key);
    const filePath = path.join(this.studyDir, filename);
    
    if (typeof value === 'string') {
      fs.writeFileSync(filePath, value);
    } else {
      fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
    }
  }

  private getFilename(key: string): string {
    return this.filenameMap[key] || `${key}.json`;
  }

  persistSession(personaId: string, session: unknown): void {
    const filePath = path.join(this.studyDir, `session_${personaId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
  }

  persistInterview(personaId: string, interview: unknown): void {
    const filePath = path.join(this.studyDir, `interview_${personaId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(interview, null, 2));
  }

  persistMarkdown(filename: string, content: string): void {
    const filePath = path.join(this.studyDir, filename);
    fs.writeFileSync(filePath, content);
  }

  getArtifactPaths(): Record<string, string> {
    const paths: Record<string, string> = {};
    for (const key of this.artifacts.keys()) {
      paths[key] = path.join(this.studyDir, this.getFilename(key));
    }
    return paths;
  }

  getCompletionStatus(): { completed: string[]; pending: string[] } {
    const allKeys = Object.keys(this.filenameMap);
    const completed: string[] = [];
    const pending: string[] = [];
    
    for (const key of allKeys) {
      if (this.artifacts.has(key)) {
        completed.push(key);
      } else {
        pending.push(key);
      }
    }
    
    return { completed, pending };
  }
}
