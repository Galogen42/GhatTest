# BPMN Constructor (Web)

This project converts the original desktop BPMN constructor into a simple web application.
It uses **React** for the client UI and a small **Express** server to talk to the OpenAI API.

## Requirements

- Node.js 18 or newer
- An OpenAI API key

## Getting Started

1. **Install Node.js** – download it from [nodejs.org](https://nodejs.org/) and follow the installer.
2. **Get the code** – clone this repository or download it as a zip.
3. Open a terminal in the project folder and run:
   ```bash
   npm install
   ```
   This installs all dependencies.
4. Set the environment variable `OPENAI_API_KEY` with your API key. On Linux/macOS you can run:
   ```bash
   export OPENAI_API_KEY=your_key_here
   ```
   On Windows command prompt use:
   ```cmd
   set OPENAI_API_KEY=your_key_here
   ```
5. Start the application in development mode:
   ```bash
   npm start
   ```
   The React frontend is served on <http://localhost:3000> while the backend runs on port `3001`.
   All API requests from the frontend use relative URLs (`/api/...`) so the
   application can be deployed on any host without code changes.

## Building for Production

To build the React app and run it from the Express server:

```bash
npm run build
node server.js
```

This creates a `dist` folder and serves it on `http://localhost:3001`.

## Model Selection and Saving

When the app loads it fetches the list of available OpenAI models from the server.
You can choose the desired model in the drop-down above the prompt field. After a
diagram is generated the interface displays the approximate price of the request
and provides buttons to save the result as XML or PNG.

## Updating Dependencies

All dependency versions are listed in `package.json`. If newer versions are
released you can update them with `npm update` (internet access required).

## Prompt Size Limit

The server reads `config/config.json` for the `MAX_PROMPT_TOKENS` parameter.
Before sending a request to OpenAI the combined prompt
(`systemPrompt + globalPrompt + description`) is measured with
`gpt-3-encoder`. If the size exceeds this limit the request is blocked and the
user interface shows the message from `PROMPT_LIMIT_MESSAGE` in the config
(default: "Exceeded prompt size limit"). The global prompt editor highlights in
red and the Generate button is disabled while over the limit.
