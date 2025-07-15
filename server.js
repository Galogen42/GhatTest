const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
const examples = require('./src/prompts/bpmn');

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

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

app.post('/api/generate', async (req, res) => {
  const { description } = req.body;
  console.log('Generating BPMN for:', description);
  const prompt = examples
    .map(e => `Text: ${e.text}\nXML:\n${e.xml}`)
    .join('\n\n');
  const fullPrompt = `${prompt}\n\nText: ${description}\nXML:`;

  try {
    const result = await openai.createCompletion({
      model: 'code-davinci-002',
      prompt: fullPrompt,
      max_tokens: 500,
      temperature: 0,
    });
    res.send(result.data.choices[0].text.trim());
  } catch (err) {
    console.error('OpenAI API error:', err);
    res.status(500).send(`<error>${err.message}</error>`);
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
