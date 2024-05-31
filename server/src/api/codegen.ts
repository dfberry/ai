import express from 'express';
import AIAssistant from '../ai-models/ai-assistant';
import Codestral from '../ai-models/codestral';
const router = express.Router();

type PromptInput = {
  input: string;
};

router.post('/', async (req, res) => {

  try {
    const prompt = req.body as PromptInput;
    const model = req.query.model as string || 'azure-assistants-code-generator';

    switch (model) {
      case 'azure-assistants-code-generator':
        const codeGen = new AIAssistant();
        const messages: string = await codeGen.generateCode(prompt.input);
        res.json({ "answer": messages});
        break;
      case 'mistral-codestral':
        const codestral = new Codestral();
        const code: string = await codestral.generateCode(prompt.input);
        res.json({ "answer": code});
        break;
      default:
        res.status(400).json({error: 'Invalid model'});
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json(error);
    } else {
      res.status(500).json({error});
    }
  }

});

export default router;
