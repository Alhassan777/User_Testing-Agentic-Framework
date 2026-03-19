/**
 * Flexible artifact manager that stores any JSON-serializable data.
 * Uses dynamic keys to avoid tight coupling with specific type structures.
 */
export declare class ArtifactManager {
    private artifacts;
    private studyDir;
    private filenameMap;
    constructor(studyDir: string);
    getArtifacts(): Record<string, unknown>;
    set(key: string, value: unknown): void;
    get<T = unknown>(key: string): T | null;
    private persist;
    private getFilename;
    persistSession(personaId: string, session: unknown): void;
    persistInterview(personaId: string, interview: unknown): void;
    persistMarkdown(filename: string, content: string): void;
    getArtifactPaths(): Record<string, string>;
    getCompletionStatus(): {
        completed: string[];
        pending: string[];
    };
}
