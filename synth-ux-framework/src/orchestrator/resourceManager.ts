import { Resource } from './types.js';

export class ResourceManager {
  private resources: Resource[] = [];
  private cleanupHandlers: Map<string, () => Promise<void>> = new Map();

  register(resource: Resource, cleanup: () => Promise<void>): void {
    this.resources.push(resource);
    this.cleanupHandlers.set(`${resource.type}:${resource.id}`, cleanup);
  }

  markFailed(resourceType: Resource['type'], resourceId: string): void {
    const resource = this.resources.find(
      r => r.type === resourceType && r.id === resourceId
    );
    if (resource) {
      resource.failed = true;
    }
  }

  async cleanupOne(resourceType: Resource['type'], resourceId: string): Promise<void> {
    const key = `${resourceType}:${resourceId}`;
    const handler = this.cleanupHandlers.get(key);
    if (handler) {
      try {
        await handler();
      } catch (error) {
        console.error(`Failed to cleanup ${key}:`, error);
      }
      this.cleanupHandlers.delete(key);
      this.resources = this.resources.filter(
        r => !(r.type === resourceType && r.id === resourceId)
      );
    }
  }

  async cleanup(): Promise<void> {
    // Cleanup in reverse order (LIFO)
    const reversedResources = [...this.resources].reverse();
    
    for (const resource of reversedResources) {
      const key = `${resource.type}:${resource.id}`;
      const handler = this.cleanupHandlers.get(key);
      
      if (handler) {
        try {
          await handler();
        } catch (error) {
          console.error(`Failed to cleanup ${key}:`, error);
        }
      }
    }

    this.resources = [];
    this.cleanupHandlers.clear();
  }

  getActiveResources(): Resource[] {
    return [...this.resources];
  }

  hasActiveResources(): boolean {
    return this.resources.length > 0;
  }
}
