const { ipcMain } = require('electron');
const { Configuration, OpenAIApi } = require('openai');
const path = require('path');
const examples = require('../prompts/bpmn');

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

ipcMain.handle('generate', async (_event, description) => {
  const prompt = examples
    .map(e => `Text: ${e.text}\nXML:\n${e.xml}`)
    .join('\n\n');

  const fullPrompt = `${prompt}\n\nText: ${description}\nXML:`;

  try {
    const res = await openai.createCompletion({
      model: 'code-davinci-002',
      prompt: fullPrompt,
      max_tokens: 500,
      temperature: 0
    });
    return res.data.choices[0].text.trim();
  } catch (err) {
    return `<error>${err.message}</error>`;
  }
});
