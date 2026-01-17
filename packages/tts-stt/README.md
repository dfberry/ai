# tts-stt

A TypeScript ESM package for converting markdown text to speech (MP3) and speech (WAV) to text using Azure Cognitive Services Speech SDK.

## Usage

### Text to Speech
```
node src/index.js tts <markdownPath> <outputMp3Path>
```

### Speech to Text
```
node src/index.js stt <inputAudioPath> <outputTextPath>
```

## Requirements
- Node.js >=22
- Azure Cognitive Services Speech key and region

## Example
- See example.md for sample input

```
npm run build && node --env-file=.env dist/index.js tts ./example.md ./generated/example.mp3
```