export class ResourceManager {
    resources = [];
    cleanupHandlers = new Map();
    register(resource, cleanup) {
        this.resources.push(resource);
        this.cleanupHandlers.set(`${resource.type}:${resource.id}`, cleanup);
    }
    markFailed(resourceType, resourceId) {
        const resource = this.resources.find(r => r.type === resourceType && r.id === resourceId);
        if (resource) {
            resource.failed = true;
        }
    }
    async cleanupOne(resourceType, resourceId) {
        const key = `${resourceType}:${resourceId}`;
        const handler = this.cleanupHandlers.get(key);
        if (handler) {
            try {
                await handler();
            }
            catch (error) {
                console.error(`Failed to cleanup ${key}:`, error);
            }
            this.cleanupHandlers.delete(key);
            this.resources = this.resources.filter(r => !(r.type === resourceType && r.id === resourceId));
        }
    }
    async cleanup() {
        // Cleanup in reverse order (LIFO)
        const reversedResources = [...this.resources].reverse();
        for (const resource of reversedResources) {
            const key = `${resource.type}:${resource.id}`;
            const handler = this.cleanupHandlers.get(key);
            if (handler) {
                try {
                    await handler();
                }
                catch (error) {
                    console.error(`Failed to cleanup ${key}:`, error);
                }
            }
        }
        this.resources = [];
        this.cleanupHandlers.clear();
    }
    getActiveResources() {
        return [...this.resources];
    }
    hasActiveResources() {
        return this.resources.length > 0;
    }
}
