# BPMN Constructor

Minimal desktop BPMN constructor built with Electron and React. It generates BPMN diagrams from text using OpenAI Codex.

## Installation

```bash
npm install
```

## Development

Run the app in development mode:

```bash
npm start
```

The React renderer is served on port `3000` and Electron loads it automatically.

## Build

Create installers for your OS:

```bash
npm run build
```

## Configuration

Set the `OPENAI_API_KEY` environment variable before launching the application so that the Codex API can be used.
