import express from 'express';
import AIAssistant from '../azure/ai-assistant';
const router = express.Router();

type PromptInput = {
  input: string;
};

router.post('/', async (req, res) => {

  try {
    const prompt = req.body as PromptInput;

    const codeGen = new AIAssistant();
    const messages: string = await codeGen.generateCode(prompt.input);

    res.json({ "answer": messages});
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json(error);
    } else {
      res.status(500).json({error});
    }
  }

});

export default router;
