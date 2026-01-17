import fs from "fs/promises";
import path from "path";
import {
  SpeechConfig,
  SpeechSynthesizer,
  AudioConfig,
  SpeechRecognizer,
  ResultReason,
} from "microsoft-cognitiveservices-speech-sdk";

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

async function textToSpeech(markdownPath: string, outputMp3Path: string) {
  const markdown = await fs.readFile(markdownPath, "utf-8");
  const plainText = markdownToText(markdown);

  const speechConfig = SpeechConfig.fromSubscription(speechKey, serviceRegion);
  speechConfig.speechSynthesisOutputFormat = 5; // Audio24Khz160KBitRateMonoMp3
  const audioConfig = AudioConfig.fromAudioFileOutput(outputMp3Path);
  const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

  synthesizer.speakTextAsync(plainText, (result: any) => {
    if (result.errorDetails) {
      console.error("Speech synthesis failed:", result.errorDetails);
    } else {
      console.log("MP3 file created at:", outputMp3Path);
    }
    synthesizer.close();
  });
}

async function speechToText(inputAudioPath: string, outputTextPath: string) {
  const speechConfig = SpeechConfig.fromSubscription(speechKey, serviceRegion);
  const audioBuffer = await fs.readFile(inputAudioPath);
  const audioConfig = AudioConfig.fromWavFileInput(audioBuffer);
  const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

  recognizer.recognizeOnceAsync((result: any) => {
    if (result.errorDetails) {
      console.error("Speech recognition failed:", result.errorDetails);
    } else {
      fs.writeFile(outputTextPath, result.text).then(() => {
        console.log("Text file created at:", outputTextPath);
      });
    }
    recognizer.close();
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
  if (mode === "tts") {
    const markdownPath = args[1] || "example.md";
    const outputMp3Path = args[2] || "output.mp3";
    await textToSpeech(markdownPath, outputMp3Path);
  } else if (mode === "stt") {
    const inputAudioPath = args[1] || "input.wav";
    const outputTextPath = args[2] || "output.txt";
    await speechToText(inputAudioPath, outputTextPath);
  } else {
    console.log("Unknown mode. Use 'tts' for text-to-speech or 'stt' for speech-to-text.");
  }
}

main();
