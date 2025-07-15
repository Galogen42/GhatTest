import React, { useState, useRef, useEffect } from 'react';
import BpmnJS from 'bpmn-js/lib/Modeler';
import './App.css';

function App() {
  const [description, setDescription] = useState('');
  const [globalPrompt, setGlobalPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [maxPromptTokens, setMaxPromptTokens] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [limitMessage, setLimitMessage] = useState('Exceeded prompt size limit');
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const containerRef = useRef(null);
  const modelerRef = useRef(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        const cfg = await res.json();
        setSystemPrompt(cfg.systemPrompt || '');
        setMaxPromptTokens(cfg.maxPromptTokens || 0);
        if (cfg.promptLimitMessage) {
          setLimitMessage(cfg.promptLimitMessage);
        }
        setErrorMessage('');
      } catch (err) {
        console.error('Failed to load config', err);
      }
    }
    loadConfig();
  }, []);

  useEffect(() => {
    async function checkLimit() {
      try {
        const res = await fetch('/api/token-count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description, globalPrompt })
        });
        const data = await res.json();
        const count = data.count || 0;
        if (maxPromptTokens && count > maxPromptTokens) {
          setIsOverLimit(true);
          setErrorMessage(limitMessage);
        } else {
          setIsOverLimit(false);
          setErrorMessage('');
        }
      } catch (err) {
        console.error('Failed to fetch token count', err);
      }
    }
    checkLimit();
  }, [globalPrompt, description, systemPrompt, maxPromptTokens, limitMessage]);

  const handleGenerate = async () => {
    setLoading(true);
    setStatus('Generating...');
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, globalPrompt })
      });
      const text = await response.text();

      if (!response.ok) {
        setStatus(`Failed to generate diagram: ${text}`);
        return;
      }

      if (text.startsWith('{')) {
        const data = JSON.parse(text);
        if (data.error) {
          setStatus(`Failed to generate diagram: ${data.error}`);
          return;
        }
      }

      const xml = text;

      if (!modelerRef.current) {
        modelerRef.current = new BpmnJS({ container: containerRef.current });
      }
      await modelerRef.current.importXML(xml);
      setStatus('');
    } catch (err) {
      console.error('Generation failed:', err);
      setStatus(`Failed to generate diagram: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>BPMN Constructor</h1>
      <textarea
        rows={4}
        className={`prompt-input${isOverLimit ? ' over-limit' : ''}`}
        value={globalPrompt}
        onChange={e => setGlobalPrompt(e.target.value)}
        placeholder="Global prompt"
      />
      <textarea
        rows={4}
        className="description-input"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Your description"
      />
      <button
        className="generate-button"
        onClick={handleGenerate}
        disabled={loading || isOverLimit}
      >
        Generate
      </button>
      {errorMessage && isOverLimit && (
        <p className="status-message">{errorMessage}</p>
      )}
      {status && <p className="status-message">{status}</p>}
      <div ref={containerRef} className="viewer-container"></div>
    </div>
  );
}

export default App;
