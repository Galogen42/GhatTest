const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const { encode } = require('gpt-3-encoder');
const OpenAI = require('openai');
const examples = require('./src/prompts/bpmn');

const configPath = path.join(__dirname, 'config', 'config.json');
const systemPromptPath = path.join(__dirname, 'config', 'systemPrompt.txt');

let systemPrompt = '';
let MAX_PROMPT_TOKENS = 1000;
let PROMPT_LIMIT_MESSAGE = 'Exceeded prompt size limit';

if (!process.env.OPENAI_API_KEY) {
  console.error(
    'Error: OPENAI_API_KEY environment variable is not set. Please provide your OpenAI API key.'
  );
  process.exit(1);
}

async function startServer() {
  const appConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
  systemPrompt = await fs.readFile(systemPromptPath, 'utf8');
  MAX_PROMPT_TOKENS = appConfig.MAX_PROMPT_TOKENS || 1000;
  PROMPT_LIMIT_MESSAGE = appConfig.PROMPT_LIMIT_MESSAGE || 'Exceeded prompt size limit';

  const app = express();
  const port = process.env.PORT || 3001;

  app.use(cors());
  app.use(express.json());
  app.use(express.static('dist'));

  app.post('/api/token-count', (req, res) => {
    const { description = '', globalPrompt = '' } = req.body;
    const examplesPrompt = examples
      .map(e => `Text: ${e.text}\nXML:\n${e.xml}`)
      .join('\n\n');
    const fullPrompt = `${systemPrompt}\n${globalPrompt}\n${examplesPrompt}\n\nText: ${description}\nXML:`;
    const count = encode(fullPrompt).length;
    res.json({ count });
  });

  app.get('/api/config', (req, res) => {
    res.json({
      systemPrompt,
      maxPromptTokens: MAX_PROMPT_TOKENS,
      promptLimitMessage: PROMPT_LIMIT_MESSAGE
    });
  });

  // simple request logging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  app.post('/api/generate', async (req, res) => {
    const { description, globalPrompt } = req.body;
    console.log('Generating BPMN for:', description);

    const examplesPrompt = examples
      .map(e => `Text: ${e.text}\nXML:\n${e.xml}`)
      .join('\n\n');
    const fullPrompt = `${systemPrompt}\n${globalPrompt || ''}\n${examplesPrompt}\n\nText: ${description}\nXML:`;
    const tokenCount = encode(fullPrompt).length;
    if (tokenCount > MAX_PROMPT_TOKENS) {
      return res.status(400).json({ error: PROMPT_LIMIT_MESSAGE });
    }

    try {
      const result = await openai.completions.create({
        model: 'gpt-3.5-turbo-instruct',
        prompt: fullPrompt,
        max_tokens: 500,
        temperature: 0,
      });

      if (!result.choices || result.choices.length === 0) {
        return res.status(502).send('<error>No completion returned</error>');
      }

      res.send(result.choices[0].text.trim());
    } catch (err) {
      console.error('OpenAI API error:', err);
      res.status(500).send(`<error>${err.message}</error>`);
    }
  });

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
