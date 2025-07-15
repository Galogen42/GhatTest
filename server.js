const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const examples = require('./src/prompts/bpmn');

if (!process.env.OPENAI_API_KEY) {
  console.error(
    'Error: OPENAI_API_KEY environment variable is not set. Please provide your OpenAI API key.'
  );
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// simple request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/generate', async (req, res) => {
  const { description } = req.body;
  console.log('Generating BPMN for:', description);
  const prompt = examples
    .map(e => `Text: ${e.text}\nXML:\n${e.xml}`)
    .join('\n\n');
  const fullPrompt = `${prompt}\n\nText: ${description}\nXML:`;

  try {
    const result = await openai.completions.create({
      // code-davinci-002 has been deprecated in favor of gpt-3.5-turbo-instruct
      model: 'gpt-3.5-turbo-instruct',
      prompt: fullPrompt,
      max_tokens: 500,
      temperature: 0,
    });
    res.send(result.choices[0].text.trim());
  } catch (err) {
    console.error('OpenAI API error:', err);
    res.status(500).send(`<error>${err.message}</error>`);
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
