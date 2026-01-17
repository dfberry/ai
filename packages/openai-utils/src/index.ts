import OpenAI from 'openai';

export interface OpenAIConfig {
  apiKey: string;
  endpoint: string;
  deploymentName: string;
  apiVersion: string;
}

export function createOpenAIClient(config: OpenAIConfig) {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: `${config.endpoint}openai/deployments/${config.deploymentName}`,
    defaultQuery: { 'api-version': config.apiVersion },
    defaultHeaders: {
      'api-key': config.apiKey,
    },
  });
}

export async function chatCompletion({
  openai,
  systemPrompt,
  userPrompt,
  urlContents = '',
  model,
  retryWithBackoff,
}: {
  openai: OpenAI;
  systemPrompt: string;
  userPrompt: string;
  urlContents?: string;
  model: string;
  retryWithBackoff: <T>(operation: () => Promise<T>, maxRetries?: number, baseDelay?: number, maxDelay?: number) => Promise<T>;
}) {
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}\n\n${urlContents}`;
  const response = await retryWithBackoff(async () => {
    return await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullPrompt },
      ],
    });
  }, 3, 2000, 65000);
  return response;
}
