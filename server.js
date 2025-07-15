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
      promptLimitMessage: PROMPT_LIMIT_MESSAGE,
      availableModels: AVAILABLE_MODELS
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

  const MODEL_PRICING = {
    'gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 },
    'gpt-3.5-turbo-instruct': { prompt: 0.0015, completion: 0.002 },
    'gpt-4': { prompt: 0.03, completion: 0.06 }
  };

  const AVAILABLE_MODELS = Object.keys(MODEL_PRICING);

  app.post('/api/generate', async (req, res) => {
    const { description, globalPrompt, model = 'gpt-3.5-turbo-instruct' } = req.body;
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
        model,
        prompt: fullPrompt,
        max_tokens: 500,
        temperature: 0,
      });

      const usage = result.usage || { prompt_tokens: 0, completion_tokens: 0 };
      const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-3.5-turbo-instruct'];
      const cost = ((usage.prompt_tokens / 1000) * pricing.prompt) +
                   ((usage.completion_tokens / 1000) * pricing.completion);

      if (!result.choices || result.choices.length === 0) {
        return res.status(502).json({ error: 'No completion returned' });
      }

      res.json({ xml: result.choices[0].text.trim(), cost });
    } catch (err) {
      console.error('OpenAI API error:', err);
      const status = err.status || err.code || 500;
      let message = 'OpenAI request failed';
      if (status === 429 || status === 503) {
        message = 'Service temporarily unavailable. Please try again later.';
      } else if (err.message) {
        message = err.message;
      }
      res.status(typeof status === 'number' ? status : 500).json({ error: message });
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
