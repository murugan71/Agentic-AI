import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const AgentNode = ({ data, isConnectable }) => {
  const isProcessing = data?.processing || false;
  const isInitializing = data?.initializing || false;
  const isInitialized = data?.initialized || false;
  
  return (
    <div className="agent-node">
      {/* Single Input Handle - Left Side */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={{ background: '#666' }}
        id="agent-input"
      />
      
      {/* Chat Model Input Handle - Bottom Left */}
      <Handle
        type="target"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#2196f3', left: '25%' }}
        id="model"
      />
      
      {/* Memory Input Handle - Bottom Center */}
      <Handle
        type="target"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#ff9800', left: '50%' }}
        id="memory"
      />
      
      {/* Tool Input Handle - Bottom Right */}
      <Handle
        type="target"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#4caf50', left: '75%' }}
        id="tool"
      />

      <div className="node-header">
        <div className="node-icon">
          {isProcessing ? (
            <div className="processing-spinner">🤖</div>
          ) : isInitializing ? (
            <div className="initializing-spinner">⚙️</div>
          ) : isInitialized ? (
            <div className="initialized-icon">✅</div>
          ) : (
            '🤖'
          )}
        </div>
        <div className="node-title">AI Agent</div>
        {(isProcessing || isInitializing) && (
          <div className="processing-indicator">
            <div className="spinner"></div>
          </div>
        )}
      </div>
      
      <div className="node-content">
        <div className="node-label">{data?.label || 'AI Agent'}</div>
        <div className="node-description">{data?.description || 'Tools Agent'}</div>
        
        {/* Show status information */}
        <div className="node-status">
          {isInitializing && (
            <div className="initializing-status">
              <span className="initializing-text">Initializing agent...</span>
              {data?.model && (
                <div className="model-info">
                  Model: {data.model}
                </div>
              )}
            </div>
          )}
          
          {isInitialized && (
            <div className="initialized-status">
              <span className="initialized-text">Agent ready</span>
              {data?.model && (
                <div className="model-info">
                  Model: {data.model}
                </div>
              )}
            </div>
          )}
          
          {!isInitializing && !isInitialized && (
            <div className="not-initialized-status">
              <span className="status-text">Connect LLM to initialize</span>
            </div>
          )}
        </div>
        
        {isProcessing && (
          <div className="processing-status">
            <span className="processing-text">Processing message...</span>
            {data?.lastMessage && (
              <div className="last-message">
                "{data.lastMessage.length > 30 ? data.lastMessage.substring(0, 30) + '...' : data.lastMessage}"
              </div>
            )}
          </div>
        )}
        
        {/* Connection Labels */}
        <div className="connection-labels">
          <div className="connection-label model-label">Chat Model</div>
          <div className="connection-label memory-label">Memory</div>
          <div className="connection-label tool-label">Tool</div>
        </div>
      </div>
      
      {/* Output Handle - Right Side */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ background: '#666' }}
        id="agent-output"
      />
    </div>
  );
};

export default memo(AgentNode);