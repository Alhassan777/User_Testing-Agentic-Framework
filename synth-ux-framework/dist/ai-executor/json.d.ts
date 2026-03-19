/**
 * Robust JSON parsing utilities for LLM responses.
 * Handles common issues like escape characters, trailing commas, and malformed strings.
 */
/**
 * Attempt to extract and parse JSON object from text with multiple fallback strategies
 */
export declare function parseJsonObject<T>(text: string, errMessage: string): T;
/**
 * Attempt to extract and parse JSON array from text with multiple fallback strategies
 */
export declare function parseJsonArray<T>(text: string, errMessage: string): T[];
/**
 * Safely extract a specific field from potentially malformed JSON
 */
export declare function extractJsonField<T>(text: string, fieldName: string, defaultValue: T): T;
