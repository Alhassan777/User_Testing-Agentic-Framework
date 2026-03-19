/**
 * Call LLM with a prompt. Uses GEMINI_API_KEY if set, else ANTHROPIC_API_KEY.
 */
export declare function callLLM(prompt: string, maxTokens?: number): Promise<string>;
/**
 * Call LLM with a screenshot image + text prompt for vision-based analysis.
 * Both Gemini and Anthropic support multimodal input.
 * @param prompt - The text instruction/question
 * @param imageBase64 - Base64-encoded PNG/JPEG image data (no data URI prefix)
 * @param maxTokens - Max output tokens
 */
export declare function callLLMWithImage(prompt: string, imageBase64: string, maxTokens?: number): Promise<string>;
/** Which LLM provider will be used (for user feedback) */
export declare function getActiveLLMProvider(): string;
