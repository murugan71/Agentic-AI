import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const MemoryNode = ({ data, isConnectable }) => {
  const getMemoryIcon = (memoryType) => {
    const iconMap = {
      vector: '🧠',
      episodic: '📚',
      working: '💾',
      knowledge: '🗂️'
    };
    return iconMap[memoryType] || '🧠';
  };

  return (
    <div className="memory-node">
      <div className="node-header">
        <div className="node-icon">{getMemoryIcon(data?.memoryType)}</div>
        <div className="node-title">Memory</div>
      </div>
      <div className="node-content">
        <div className="node-label">{data?.label || 'Memory'}</div>
        <div className="node-description">{data?.memoryType || 'Generic memory'}</div>
        <div className="node-status">{data?.status || 'Ready'}</div>
      </div>
      <Handle
        type="source"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#ff9800' }}
        id="memory-output"
      />
    </div>
  );
};

export default memo(MemoryNode);