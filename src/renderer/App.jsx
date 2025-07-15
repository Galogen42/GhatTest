import React, { useState, useRef } from 'react';
import BpmnJS from 'bpmn-js/lib/Modeler';
import './App.css';

function App() {
  const [description, setDescription] = useState('');
  const containerRef = useRef(null);
  const modelerRef = useRef(null);

  const handleGenerate = async () => {
    const response = await fetch('http://localhost:3001/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    });
    const xml = await response.text();
    if (!modelerRef.current) {
      modelerRef.current = new BpmnJS({ container: containerRef.current });
    }
    try {
      await modelerRef.current.importXML(xml);
    } catch (err) {
      console.error(err);
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
      <button className="generate-button" onClick={handleGenerate}>
        Generate
      </button>
      <div ref={containerRef} className="viewer-container"></div>
    </div>
  );
}

export default App;
