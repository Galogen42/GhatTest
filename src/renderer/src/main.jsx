import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return <h1>React OK</h1>;
}

export default App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
