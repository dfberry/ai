import fs from "fs/promises";
import { fileURLToPath } from 'url';

// ESM __dirname polyfill
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import path from "path";
import {
  SpeechConfig,
  SpeechSynthesizer,
  AudioConfig,
  SpeechRecognizer,
  ResultReason,
} from "microsoft-cognitiveservices-speech-sdk";

// Response type for TTS and STT
export interface SpeechResponse {
  status: 'success' | 'error';
  error?: string;
  output?: string; // output file path or recognized text
  inputPath?: string;
  outputPath?: string;
  charCount?: number;
  sdkResult?: any;
}

// Replace with your Azure Speech key and region
const speechKey = process.env.AZURE_SPEECH_KEY || "<YOUR_AZURE_SPEECH_KEY>";
const serviceRegion = process.env.AZURE_SPEECH_REGION || "<YOUR_AZURE_SPEECH_REGION>";

function markdownToText(md: string): string {
  return md
    .replace(/^# .*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\n{2,}/g, "\n")
    .replace(/^-\s+/gm, "")
    .replace(/"/g, "'")
    .trim();
}

export async function textToSpeech(markdownPath: string, outputMp3Path: string): Promise<SpeechResponse> {
  if (!markdownPath || !outputMp3Path) {
    return { status: 'error', error: 'Both markdownPath and outputMp3Path are required.' };
  }
  try {
    await fs.access(markdownPath);
  } catch {
    return { status: 'error', error: `Markdown file does not exist: ${markdownPath}`, inputPath: markdownPath };
  }
  const markdown = await fs.readFile(markdownPath, "utf-8");
  const plainText = markdownToText(markdown);
  const charCount = plainText.length;
  const speechConfig = SpeechConfig.fromSubscription(speechKey, serviceRegion);
  speechConfig.speechSynthesisOutputFormat = 5; // Audio24Khz160KBitRateMonoMp3
  const audioConfig = AudioConfig.fromAudioFileOutput(outputMp3Path);
  const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

  return new Promise((resolve) => {
    synthesizer.speakTextAsync(plainText, (result: any) => {
      const response: SpeechResponse = {
        status: result.errorDetails ? 'error' : 'success',
        error: result.errorDetails || undefined,
        output: result.errorDetails ? undefined : outputMp3Path,
        inputPath: markdownPath,
        outputPath: outputMp3Path,
        charCount,
        sdkResult: result,
      };
      synthesizer.close();
      resolve(response);
    });
  });
}

export async function speechToText(inputAudioPath: string, outputTextPath: string): Promise<SpeechResponse> {
  if (!inputAudioPath || !outputTextPath) {
    return { status: 'error', error: 'Both inputAudioPath and outputTextPath are required.' };
  }
  try {
    await fs.access(inputAudioPath);
  } catch {
    return { status: 'error', error: `Input audio file does not exist: ${inputAudioPath}`, inputPath: inputAudioPath };
  }
  const speechConfig = SpeechConfig.fromSubscription(speechKey, serviceRegion);
  const audioBuffer = await fs.readFile(inputAudioPath);
  const audioConfig = AudioConfig.fromWavFileInput(audioBuffer);
  const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

  return new Promise((resolve) => {
    recognizer.recognizeOnceAsync((result: any) => {
      if (result.errorDetails) {
        resolve({
          status: 'error',
          error: result.errorDetails,
          inputPath: inputAudioPath,
          outputPath: outputTextPath,
          sdkResult: result,
        });
      } else {
        fs.writeFile(outputTextPath, result.text).then(() => {
          resolve({
            status: 'success',
            output: outputTextPath,
            inputPath: inputAudioPath,
            outputPath: outputTextPath,
            sdkResult: result,
          });
        }).catch((err) => {
          resolve({
            status: 'error',
            error: err.message,
            inputPath: inputAudioPath,
            outputPath: outputTextPath,
            sdkResult: result,
          });
        });
      }
      recognizer.close();
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage:");
    console.log("  node src/index.js tts <markdownPath> <outputMp3Path>");
    console.log("  node src/index.js stt <inputAudioPath> <outputTextPath>");
    return;
  }
  const mode = args[0];
  try {
    let response: SpeechResponse;
    if (mode === "tts") {
      if (!args[1] || !args[2]) {
        throw new Error("tts mode requires <markdownPath> and <outputMp3Path> arguments.");
      }
      const markdownPath = path.isAbsolute(args[1]) ? args[1] : path.resolve(process.cwd(), args[1]);
      const outputMp3Path = path.isAbsolute(args[2]) ? args[2] : path.resolve(process.cwd(), args[2]);
      response = await textToSpeech(markdownPath, outputMp3Path);
      if (response.status === 'success') {
        console.log(`MP3 file created at: ${response.output}`);
        console.log(`Text to synthesize: ${response.charCount} characters`);
      } else {
        console.error(`TTS Error: ${response.error}`);
      }
      console.log('SDK result:', response.sdkResult);
    } else if (mode === "stt") {
      if (!args[1] || !args[2]) {
        throw new Error("stt mode requires <inputAudioPath> and <outputTextPath> arguments.");
      }
      const inputAudioPath = path.isAbsolute(args[1]) ? args[1] : path.resolve(process.cwd(), args[1]);
      const outputTextPath = path.isAbsolute(args[2]) ? args[2] : path.resolve(process.cwd(), args[2]);
      response = await speechToText(inputAudioPath, outputTextPath);
      if (response.status === 'success') {
        console.log(`Text file created at: ${response.output}`);
      } else {
        console.error(`STT Error: ${response.error}`);
      }
      console.log('SDK result:', response.sdkResult);
    } else {
      console.log("Unknown mode. Use 'tts' for text-to-speech or 'stt' for speech-to-text.");
    }
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

main();
