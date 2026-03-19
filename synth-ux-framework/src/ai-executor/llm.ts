import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider } from './types.js';

function getLLMProvider(): LLMProvider | null {
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return null;
}

/**
 * Call LLM with a prompt. Uses GEMINI_API_KEY if set, else ANTHROPIC_API_KEY.
 */
export async function callLLM(prompt: string, maxTokens: number = 4000): Promise<string> {
  const provider = getLLMProvider();
  if (!provider) {
    throw new Error(
      'Set GEMINI_API_KEY or ANTHROPIC_API_KEY in your environment. ' +
      'Get Gemini key: https://aistudio.google.com/apikey | Anthropic: https://console.anthropic.com'
    );
  }

  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { maxOutputTokens: maxTokens },
    });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    if (!text) throw new Error('Gemini returned empty response');
    return text;
  }

  // Anthropic
  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  if (!text) throw new Error('Anthropic returned empty response');
  return text;
}

/**
 * Call LLM with a screenshot image + text prompt for vision-based analysis.
 * Both Gemini and Anthropic support multimodal input.
 * @param prompt - The text instruction/question
 * @param imageBase64 - Base64-encoded PNG/JPEG image data (no data URI prefix)
 * @param maxTokens - Max output tokens
 */
export async function callLLMWithImage(
  prompt: string,
  imageBase64: string,
  maxTokens: number = 2000
): Promise<string> {
  const provider = getLLMProvider();
  if (!provider) {
    throw new Error(
      'Set GEMINI_API_KEY or ANTHROPIC_API_KEY in your environment.'
    );
  }

  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { maxOutputTokens: maxTokens },
    });
    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: 'image/png', data: imageBase64 } },
    ]);
    const text = result.response.text();
    if (!text) throw new Error('Gemini returned empty response for image prompt');
    return text;
  }

  // Anthropic Claude vision
  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: imageBase64 },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  if (!text) throw new Error('Anthropic returned empty response for image prompt');
  return text;
}

/** Which LLM provider will be used (for user feedback) */
export function getActiveLLMProvider(): string {
  if (process.env.GEMINI_API_KEY) return 'Gemini (GEMINI_API_KEY)';
  if (process.env.ANTHROPIC_API_KEY) return 'Anthropic Claude (ANTHROPIC_API_KEY)';
  return 'None set';
}
