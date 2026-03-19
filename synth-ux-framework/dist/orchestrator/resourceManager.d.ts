import { Resource } from './types.js';
export declare class ResourceManager {
    private resources;
    private cleanupHandlers;
    register(resource: Resource, cleanup: () => Promise<void>): void;
    markFailed(resourceType: Resource['type'], resourceId: string): void;
    cleanupOne(resourceType: Resource['type'], resourceId: string): Promise<void>;
    cleanup(): Promise<void>;
    getActiveResources(): Resource[];
    hasActiveResources(): boolean;
}
