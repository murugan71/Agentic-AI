import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const LLMNode = ({ data, isConnectable }) => {
  return (
    <div className="llm-node">
      <div className="node-header">
        <div className="node-icon">🧠</div>
        <div className="node-title">LLM</div>
      </div>
      <div className="node-content">
        <div className="node-label">{data?.label || 'Language Model'}</div>
        <div className="node-description">{data?.model || 'GPT-4'}</div>
        <div className="node-status">{data?.status || 'Ready'}</div>
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