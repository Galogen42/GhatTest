import React, { useState, useRef } from 'react';
import BpmnJS from 'bpmn-js/lib/Modeler';

function App() {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const modelerRef = useRef(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      const xml = await response.text();
      if (!modelerRef.current) {
        modelerRef.current = new BpmnJS({ container: containerRef.current });
      }
      await modelerRef.current.importXML(xml);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <textarea
        rows={4}
        style={{ width: '100%' }}
        value={description}
      onChange={e => setDescription(e.target.value)}
      />
      <button onClick={handleGenerate}>Generate</button>
      {isLoading && <p>Generating…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div
        ref={containerRef}
        style={{ height: 500, border: '1px solid #ccc', marginTop: 10 }}
      ></div>
    </div>
  );
}

export default App;
