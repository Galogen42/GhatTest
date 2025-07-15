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
  const [tokenCount, setTokenCount] = useState(0);
  const [availableModels, setAvailableModels] = useState([]);
  const [model, setModel] = useState('gpt-3.5-turbo-instruct');
  const [requestCost, setRequestCost] = useState(0);
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
        if (Array.isArray(cfg.availableModels)) {
          setAvailableModels(cfg.availableModels);
          setModel(cfg.availableModels[0] || model);
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
        setTokenCount(count);
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
        body: JSON.stringify({ description, globalPrompt, model })
      });
      const text = await response.text();

      if (!response.ok) {
        setStatus(`Failed to generate diagram: ${text}`);
        return;
      }

      let xml = text;
      let cost = 0;
      if (text.startsWith('{')) {
        const data = JSON.parse(text);
        if (data.error) {
          setStatus(`Failed to generate diagram: ${data.error}`);
          return;
        }
        xml = data.xml;
        cost = data.cost || 0;
        setRequestCost(cost);
      }

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

  const handleSaveXml = async () => {
    if (!modelerRef.current) return;
    try {
      const { xml } = await modelerRef.current.saveXML({ format: true });
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.bpmn';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to save XML', err);
    }
  };

  const handleSavePng = async () => {
    if (!modelerRef.current) return;
    try {
      const { svg } = await modelerRef.current.saveSVG();
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'diagram.png';
          a.click();
          URL.revokeObjectURL(url);
        });
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    } catch (err) {
      console.error('Failed to save PNG', err);
    }
  };

  return (
    <div className="app-container">
      <h1>BPMN Constructor</h1>
      <div className="model-select-wrapper">
        <label>
          Model:
          <select value={model} onChange={e => setModel(e.target.value)}>
            {availableModels.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <span className="cost-display">{`Cost: $${requestCost.toFixed(4)}`}</span>
      </div>
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
      <p>Tokens: {tokenCount}{maxPromptTokens ? ` / ${maxPromptTokens}` : ''}</p>
      <button
        className="generate-button"
        onClick={handleGenerate}
        disabled={loading || isOverLimit}
      >
        Generate
      </button>
      {modelerRef.current && (
        <>
          <button className="generate-button" onClick={handleSaveXml}>Save XML</button>
          <button className="generate-button" onClick={handleSavePng}>Save PNG</button>
        </>
      )}
      {errorMessage && isOverLimit && (
        <p className="status-message">{errorMessage}</p>
      )}
      {status && <p className="status-message">{status}</p>}
      <div ref={containerRef} className="viewer-container"></div>
    </div>
  );
}

export default App;
