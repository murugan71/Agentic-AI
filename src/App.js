import Flow from './Flow.js';
import { ReactFlowProvider } from 'reactflow';
import './App.css';

function App() {
  return (
    <div className="App">
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </div>
  );
}

export default App;
