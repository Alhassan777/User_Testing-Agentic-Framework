/**
 * Robust JSON parsing utilities for LLM responses.
 * Handles common issues like escape characters, trailing commas, and malformed strings.
 */
/**
 * Sanitize JSON string to fix common LLM output issues
 */
function sanitizeJson(text) {
    let sanitized = text;
    // Remove markdown code fences if present
    sanitized = sanitized.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    // Fix unescaped newlines inside strings (common LLM error)
    // This regex finds strings and replaces literal newlines with \n
    sanitized = sanitized.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t'));
    // Fix unescaped backslashes that aren't part of valid escape sequences
    sanitized = sanitized.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
    // Remove trailing commas before } or ]
    sanitized = sanitized.replace(/,(\s*[}\]])/g, '$1');
    // Fix single quotes used as string delimiters (convert to double quotes)
    // Only do this outside of already double-quoted strings
    sanitized = sanitized.replace(/'([^']+)'/g, (match, content) => {
        // Don't replace if it looks like it's inside a string
        if (content.includes('"'))
            return match;
        return `"${content}"`;
    });
    return sanitized;
}
/**
 * Attempt to extract and parse JSON object from text with multiple fallback strategies
 */
export function parseJsonObject(text, errMessage) {
    const strategies = [
        // Strategy 1: Direct parse after extracting JSON block
        () => {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
                throw new Error('No JSON object found');
            return JSON.parse(jsonMatch[0]);
        },
        // Strategy 2: Sanitize then parse
        () => {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
                throw new Error('No JSON object found');
            return JSON.parse(sanitizeJson(jsonMatch[0]));
        },
        // Strategy 3: More aggressive sanitization
        () => {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
                throw new Error('No JSON object found');
            let json = jsonMatch[0];
            // Replace problematic unicode
            json = json.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
            // Remove any BOM
            json = json.replace(/^\uFEFF/, '');
            return JSON.parse(sanitizeJson(json));
        },
        // Strategy 4: Line-by-line reconstruction
        () => {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
                throw new Error('No JSON object found');
            const lines = jsonMatch[0].split('\n');
            const cleanLines = lines.map(line => {
                // Skip obviously broken lines
                if (line.includes('```'))
                    return '';
                return line;
            }).filter(Boolean);
            return JSON.parse(sanitizeJson(cleanLines.join('\n')));
        },
    ];
    let lastError = null;
    for (const strategy of strategies) {
        try {
            return strategy();
        }
        catch (e) {
            lastError = e;
            continue;
        }
    }
    throw new Error(`${errMessage}: ${lastError?.message || 'Unknown parsing error'}`);
}
/**
 * Attempt to extract and parse JSON array from text with multiple fallback strategies
 */
export function parseJsonArray(text, errMessage) {
    const strategies = [
        // Strategy 1: Direct parse
        () => {
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch)
                throw new Error('No JSON array found');
            return JSON.parse(jsonMatch[0]);
        },
        // Strategy 2: Sanitize then parse
        () => {
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch)
                throw new Error('No JSON array found');
            return JSON.parse(sanitizeJson(jsonMatch[0]));
        },
        // Strategy 3: More aggressive sanitization
        () => {
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch)
                throw new Error('No JSON array found');
            let json = jsonMatch[0];
            json = json.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
            json = json.replace(/^\uFEFF/, '');
            return JSON.parse(sanitizeJson(json));
        },
        // Strategy 4: Try to find array inside an object wrapper
        () => {
            const objMatch = text.match(/\{[\s\S]*"(?:items|results|data|list|personas|sessions|tasks)":\s*(\[[\s\S]*?\])[\s\S]*\}/);
            if (objMatch && objMatch[1]) {
                return JSON.parse(sanitizeJson(objMatch[1]));
            }
            throw new Error('No array found in object wrapper');
        },
    ];
    let lastError = null;
    for (const strategy of strategies) {
        try {
            return strategy();
        }
        catch (e) {
            lastError = e;
            continue;
        }
    }
    throw new Error(`${errMessage}: ${lastError?.message || 'Unknown parsing error'}`);
}
/**
 * Safely extract a specific field from potentially malformed JSON
 */
export function extractJsonField(text, fieldName, defaultValue) {
    try {
        const obj = parseJsonObject(text, 'Field extraction failed');
        if (fieldName in obj) {
            return obj[fieldName];
        }
        return defaultValue;
    }
    catch {
        // Try regex extraction as fallback
        const fieldRegex = new RegExp(`"${fieldName}"\\s*:\\s*([^,}\\]]+|"[^"]*"|\\[[^\\]]*\\]|\\{[^}]*\\})`, 'i');
        const match = text.match(fieldRegex);
        if (match && match[1]) {
            try {
                return JSON.parse(match[1]);
            }
            catch {
                // If it's a simple value, return as-is
                const val = match[1].trim();
                if (val.startsWith('"') && val.endsWith('"')) {
                    return val.slice(1, -1);
                }
                if (val === 'true')
                    return true;
                if (val === 'false')
                    return false;
                if (!isNaN(Number(val)))
                    return Number(val);
            }
        }
        return defaultValue;
    }
}
