import fs from 'fs';
import path from 'path';
import { AGENTS_DIR } from './paths.js';
export function loadAgentDefinition(agentName) {
    const filePath = path.join(AGENTS_DIR, `${agentName}.md`);
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
    }
    throw new Error(`Agent definition not found: ${agentName}`);
}
