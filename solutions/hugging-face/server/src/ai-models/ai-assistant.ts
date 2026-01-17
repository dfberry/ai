import 'dotenv/config';
import { AzureOpenAI } from 'openai';
import {
  Assistant,
  AssistantCreateParams,
  AssistantTool,
} from 'openai/resources/beta/assistants';
import { Message, MessagesPage } from 'openai/resources/beta/threads/messages';
import { Run } from 'openai/resources/beta/threads/runs/runs';
import { Thread } from 'openai/resources/beta/threads/threads';
import {
  DefaultAzureCredential,
  getBearerTokenProvider,
} from '@azure/identity';

export default class AIAssistant {
  private assistantsClient: AzureOpenAI;

  constructor() {
    const azureOpenAIEndpoint = process.env.AZURE_OPENAI_ENDPOINT as string;
    const azureOpenAIDeployment = process.env
      .AZURE_OPENAI_DEPLOYMENT_NAME as string;
    const azureOpenAIVersion = process.env.AZURE_OPENAI_VERSION as string;

    if (!azureOpenAIEndpoint || !azureOpenAIDeployment) {
      throw new Error(
        'Please ensure to set AZURE_OPENAI_DEPLOYMENT_NAME and AZURE_OPENAI_ENDPOINT in your environment variables.',
      );
    }

    const credential = new DefaultAzureCredential();
    const scope = 'https://cognitiveservices.azure.com/.default';
    const azureADTokenProvider = getBearerTokenProvider(credential, scope);
    this.assistantsClient = new AzureOpenAI({
      endpoint: azureOpenAIEndpoint,
      azureADTokenProvider,
      apiVersion: azureOpenAIVersion,
    });
  }

  async generateCode(prompt: string):Promise<string> {

    /*
    const instructions = `Given a prompt, this assistant will generate code in .NET, 
    Java, JavaScript, and Python that solves the problem. The code must be clear, 
    concise, and correct. It must include instruction in a comment on dependencies 
    to install and it must include tests for the code. The entire code block should 
    be able to be saved to a file and immediately executed if the dependencies are 
    installed. The prompt may include a code snippet that needs to be translated into 
    the other languages. The prompt may also include a problem that needs to be solved.`;
    */

    const instructions = `You are a personal math tutor. Write and run JavaScript code 
    to answer math questions. The answer must return the correct code surrounded
    by 3 backticks on each side. Don't return anything but the code and backticks.`

    const options: AssistantCreateParams = {
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME as string, // Deployment name seen in Azure AI Studio
      name: 'Math Tutor',//'Azure SDK Code Generator',
      instructions,
      tools: [{ type: 'code_interpreter' } as AssistantTool],
    };
    const role = 'user';
    const message = prompt || 'Write a function to add 2 numbers and return the result.';
    
    // Create an assistant
    const assistantResponse: Assistant =
      await this.assistantsClient.beta.assistants.create(options);
    console.log(`Assistant created: ${JSON.stringify(assistantResponse)}`);
    
    // Create a thread
    const assistantThread: Thread = await this.assistantsClient.beta.threads.create({});
    console.log(`Thread created: ${JSON.stringify(assistantThread)}`);
    
    // Add a user question to the thread
    const threadResponse: Message =
      await this.assistantsClient.beta.threads.messages.create(assistantThread.id, {
        role,
        content: message,
      });
    console.log(`Message created:  ${JSON.stringify(threadResponse)}`);
    
    // Run the thread and poll it until it is in a terminal state
    const runResponse: Run = await this.assistantsClient.beta.threads.runs.createAndPoll(
      assistantThread.id,
      {
        assistant_id: assistantResponse.id,
      },
      { pollIntervalMs: 500 },
    );
    console.log(`Run created:  ${JSON.stringify(runResponse)}`);
    
    // Get the messages
    const runMessages: MessagesPage =
      await this.assistantsClient.beta.threads.messages.list(assistantThread.id);

    let returnedMessages = '';
      
    for await (const runMessageDatum of runMessages) {
      for (const item of runMessageDatum.content) {
        // types are: "image_file" or "text"
        if (item.type === 'text') {
          console.log(`Message content: ${JSON.stringify(item.text?.value)}`);
          returnedMessages += item.text?.value;
        }
      }
    }
    return returnedMessages;
  }
}