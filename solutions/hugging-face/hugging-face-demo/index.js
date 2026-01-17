import { HfInference } from '@huggingface/inference';

const authToken = process.env.HUGGING_FACE_ACCESS_TOKEN;

const inference = new HfInference(authToken);

const model = "nlpconnect/vit-gpt2-image-captioning";

// Image URL for jpg
const image = "https://wallpaperaccess.com/full/4723250.jpg";

const response = await fetch(image);
const imageBlob = await response.blob();

const result = await inference.imageToText({
    data: imageBlob,
    model: model,
});

console.log(result);