import fetch from 'node-fetch';

type GenerateCodeOptions = {
    model: string;
    suffix: string;
    maxTokens: number;
    temperature: number;
};

export default class Codestral {

    private apiKey: string;

    constructor() {

        this.apiKey = process.env.MISTRAL_API_KEY as string;

        if (!this.apiKey) {
            throw new Error('Please ensure to set MISTRAL_API_KEY in your environment variables.');
        }
    }


    async generateCode(prompt: string, options?: Partial<GenerateCodeOptions>):Promise<string> {
        const url = 'https://api.mistral.ai/v1/fim/completions';
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };
        const body = JSON.stringify({
            model: options?.model || 'codestral-latest',
            prompt,
            suffix: options?.suffix || '', // used in fill in the middle (FIM) completion (optional)
            //max_tokens: options?.maxTokens || 100,
            //temperature: options?.temperature || 0.5
        });

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('codestra ', data);
        if(data && data.choices.length > 0) {
            return data?.choices[0]?.message.content || "";
        }

        return ""
    }
}