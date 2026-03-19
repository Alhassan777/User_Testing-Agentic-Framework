import fs from 'fs';
import path from 'path';
/**
 * Flexible artifact manager that stores any JSON-serializable data.
 * Uses dynamic keys to avoid tight coupling with specific type structures.
 */
export class ArtifactManager {
    artifacts = new Map();
    studyDir;
    filenameMap = {
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
    constructor(studyDir) {
        this.studyDir = studyDir;
    }
    getArtifacts() {
        const result = {};
        for (const [key, value] of this.artifacts) {
            result[key] = value;
        }
        return result;
    }
    set(key, value) {
        this.artifacts.set(key, value);
        this.persist(key, value);
    }
    get(key) {
        return this.artifacts.get(key) ?? null;
    }
    persist(key, value) {
        if (value === null || value === undefined)
            return;
        const filename = this.getFilename(key);
        const filePath = path.join(this.studyDir, filename);
        if (typeof value === 'string') {
            fs.writeFileSync(filePath, value);
        }
        else {
            fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
        }
    }
    getFilename(key) {
        return this.filenameMap[key] || `${key}.json`;
    }
    persistSession(personaId, session) {
        const filePath = path.join(this.studyDir, `session_${personaId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
    }
    persistInterview(personaId, interview) {
        const filePath = path.join(this.studyDir, `interview_${personaId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(interview, null, 2));
    }
    persistMarkdown(filename, content) {
        const filePath = path.join(this.studyDir, filename);
        fs.writeFileSync(filePath, content);
    }
    getArtifactPaths() {
        const paths = {};
        for (const key of this.artifacts.keys()) {
            paths[key] = path.join(this.studyDir, this.getFilename(key));
        }
        return paths;
    }
    getCompletionStatus() {
        const allKeys = Object.keys(this.filenameMap);
        const completed = [];
        const pending = [];
        for (const key of allKeys) {
            if (this.artifacts.has(key)) {
                completed.push(key);
            }
            else {
                pending.push(key);
            }
        }
        return { completed, pending };
    }
}
