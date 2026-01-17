import Fastify from 'fastify';
import dotenv from 'dotenv';
import { createOpenAIClient, chatCompletion, OpenAIConfig } from '../../../packages/openai-utils/src';
import path from 'path';
import { extractUrls, fetchUrlContent } from './utils/urlUtils';
import { readFileContent, readFolderContents } from './utils/fileUtils';

dotenv.config();

const fastify = Fastify({ logger: true });

const openaiConfig: OpenAIConfig = {
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
};
const openai = createOpenAIClient(openaiConfig);

// Retry utility function with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 60000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1}/${maxRetries + 1}`);
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error (429)
      const isRateLimit = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('rate limit');
      
      if (!isRateLimit || attempt === maxRetries) {
        console.log(`Non-retryable error or max retries reached. Error:`, error?.message);
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      
      // Extract retry-after header if available
      let retryAfter = 0;
      if (error?.headers?.['retry-after']) {
        retryAfter = parseInt(error.headers['retry-after']) * 1000;
      } else if (error?.message?.includes('retry after')) {
        // Parse "retry after X seconds" from error message
        const match = error.message.match(/retry after (\d+) seconds/i);
        if (match) {
          retryAfter = parseInt(match[1]) * 1000;
        }
      }

      const finalDelay = Math.max(delay, retryAfter);
      
      console.log(`Rate limit hit (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${finalDelay}ms...`);
      console.log(`Error details:`, {
        status: error?.status,
        message: error?.message?.substring(0, 200),
        retryAfter: retryAfter > 0 ? `${retryAfter}ms` : 'not specified'
      });
      
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }

  throw lastError;
}

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../public'),
  prefix: '/',
});

fastify.post('/api/generate', async (request, reply) => {
  console.log('=== API GENERATE REQUEST START ===');
  const { systemPrompt, userPrompt } = request.body as { systemPrompt: string; userPrompt: string };

  console.log('Request body received:', {
    systemPromptLength: systemPrompt?.length || 0,
    userPromptLength: userPrompt?.length || 0,
    systemPromptPreview: systemPrompt?.substring(0, 100) + (systemPrompt?.length > 100 ? '...' : ''),
    userPromptPreview: userPrompt?.substring(0, 100) + (userPrompt?.length > 100 ? '...' : '')
  });

  try {
    console.log('Extracting URLs from user prompt...');
    const urls = extractUrls(userPrompt);
    console.log('URLs found:', urls);
    
    let urlContents = '';

    for (const url of urls) {
      console.log(`Fetching content for URL: ${url}`);
      const content = await fetchUrlContent(url);
      if (content) {
        console.log(`Successfully fetched content from ${url}, length: ${content.length}`);
        urlContents += `\nContent from ${url}:\n${content}`;
      } else {
        console.error(`Could not fetch content for URL: ${url}`);
      }
    }

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}\n\n${urlContents}`;
    console.log('Full prompt prepared, total length:', fullPrompt.length);

    console.log('Making OpenAI API call with retry logic...');
    console.log('OpenAI config:', {
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      hasApiKey: !!process.env.AZURE_OPENAI_API_KEY,
      hasEndpoint: !!process.env.AZURE_OPENAI_ENDPOINT,
      hasDeploymentName: !!process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      apiKeyPreview: process.env.AZURE_OPENAI_API_KEY ? process.env.AZURE_OPENAI_API_KEY.substring(0, 10) + '...' : 'NOT_SET',
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME
    });

    const response = await chatCompletion({
      openai,
      systemPrompt,
      userPrompt,
      urlContents,
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
      retryWithBackoff,
    });

    console.log('OpenAI API response received:', {
      id: response.id,
      model: response.model,
      usage: response.usage,
      choicesLength: response.choices?.length || 0,
      firstChoiceFinishReason: response.choices?.[0]?.finish_reason,
      messageContentLength: response.choices?.[0]?.message?.content?.length || 0,
      messageContentPreview: response.choices?.[0]?.message?.content ? 
        response.choices[0].message.content.substring(0, 200) + (response.choices[0].message.content.length > 200 ? '...' : '') : 
        'NO_CONTENT'
    });

    const answer = response.choices[0].message?.content;
    console.log('Extracted answer:', {
      hasAnswer: !!answer,
      answerLength: answer?.length || 0,
      answerType: typeof answer
    });

    console.log('Sending response to client...');
    const responseData = { answer };
    console.log('Response data being sent:', responseData);
    
    reply.send(responseData);
    console.log('=== API GENERATE REQUEST END (SUCCESS) ===');
  } catch (error: any) {
    console.error('=== API GENERATE REQUEST END (ERROR) ===');
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      cause: error?.cause
    });
    
    if (error?.response) {
      console.error('OpenAI API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    reply.status(500).send({ error: 'Failed to generate response', details: error?.message || 'Unknown error' });
  }
});

fastify.post('/api/upload', async (request, reply) => {
  const files = (request.body as any).files as { name: string; content: string }[];
  let fileContents = '';

  for (const file of files) {
    fileContents += `\nContent from ${file.name}:\n${file.content}`;
  }

  reply.send({ fileContents });
});

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server running at ${address}`);
});