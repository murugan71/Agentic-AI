import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const LLMNode = ({ data, isConnectable }) => {
  const isProcessing = data?.processing || false;
  
  return (
    <div className="llm-node">
      <div className="node-header">
        <div className="node-icon">
          {isProcessing ? (
            <div className="processing-spinner">🧠</div>
          ) : (
            '🧠'
          )}
        </div>
        <div className="node-title">LLM</div>
        {isProcessing && (
          <div className="processing-indicator">
            <div className="spinner"></div>
          </div>
        )}
      </div>
      <div className="node-content">
        <div className="node-label">{data?.label || 'Language Model'}</div>
        <div className="node-description">{data?.model || 'GPT-4'}</div>
        {data?.agent && (
          <div className="node-provider" style={{ 
            fontSize: '10px', 
            color: '#666', 
            marginTop: '2px',
            textTransform: 'uppercase'
          }}>
            {data.agent === 'openai' ? 'OpenAI' : 'Groq'} Agent
          </div>
        )}
        
        {/* LLM Processing Status */}
        {isProcessing ? (
          <div className="llm-processing-status">
            <div className="llm-processing-indicator">
              <div className="llm-spinner">⚡</div>
              <span className="llm-processing-text">Processing ({data?.model || 'LLM'})...</span>
            </div>
          </div>
        ) : (
          <div className="node-status">{data?.status || 'Ready'}</div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ background: '#4285f4' }}
        id="llm-output"
      />
    </div>
  );
};

export default memo(LLMNode);