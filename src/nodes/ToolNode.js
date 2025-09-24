import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const ToolNode = ({ data, isConnectable }) => {
  const getToolIcon = (toolType) => {
    const iconMap = {
      search: '🔍',
      analysis: '📊',
      text: '📝',
      image: '📷',
      api: '🔧',
      file: '📋'
    };
    return iconMap[toolType] || '🛠️';
  };

  return (
    <div className="tool-node">
      {/* Single Handle for both input and output */}
      <Handle
        type="source"
        position={Position.Left}
        isConnectable={isConnectable}
        style={{ background: '#4caf50' }}
        id="tool-connection"
      />
      <div className="node-header">
        <div className="node-icon">{getToolIcon(data?.toolType)}</div>
        <div className="node-title">Tool</div>
      </div>
      <div className="node-content">
        <div className="node-label">{data?.label || 'Tool'}</div>
        <div className="node-description">{data?.toolType || 'Generic tool'}</div>
        <div className="node-status">{data?.status || 'Ready'}</div>
      </div>
    </div>
  );
};

export default memo(ToolNode);