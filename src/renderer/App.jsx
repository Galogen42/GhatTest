import React, { useState, useRef } from 'react';
import BpmnJS from 'bpmn-js/lib/Modeler';
import './App.css';

function App() {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const containerRef = useRef(null);
  const modelerRef = useRef(null);

  const handleGenerate = async () => {
    setLoading(true);
    setStatus('Generating...');
    try {
      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      const xml = await response.text();

      if (!response.ok) {
        setStatus(`Failed to generate diagram: ${xml}`);
        return;
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

  return (
    <div className="app-container">
      <h1>BPMN Constructor</h1>
      <textarea
        rows={4}
        className="description-input"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />
      <button
        className="generate-button"
        onClick={handleGenerate}
        disabled={loading}
      >
        Generate
      </button>
      {status && <p className="status-message">{status}</p>}
      <div ref={containerRef} className="viewer-container"></div>
    </div>
  );
}

export default App;
