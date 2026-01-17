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

## TypeScript Type Conflict Note

This package depends on `microsoft-cognitiveservices-speech-sdk`, which brings in `@types/webrtc` as a dependency. In monorepo or multi-package setups, this can cause type conflicts with the TypeScript DOM types (e.g., duplicate or conflicting declarations for WebRTC types like `RTCPeerConnection`).

**How this package avoids the conflict:**
- The `tsconfig.json` for this package sets `"types": ["node"]` to avoid pulling in global DOM/WebRTC types.
- The `package.json` includes a `typesVersions` field to exclude the `webrtc` types from TypeScript resolution in this package.

**If you see errors about duplicate or conflicting WebRTC types:**
- Make sure you do not include `DOM` in the `lib` array of your `tsconfig.json` unless you are writing browser code.
- Do not add `@types/webrtc` as a direct dependency unless you are writing WebRTC code.
- If you need to use both, you may need to further customize your TypeScript configuration to avoid conflicts.

This setup ensures that you can use this package in a Node.js environment without running into WebRTC type conflicts from dependencies.