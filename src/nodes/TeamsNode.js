import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const TeamsNode = ({ data, isConnectable }) => {
  return (
    <div className="teams-node">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={{ background: '#6264a7' }}
        id="teams-input"
      />
      <div className="node-header">
        <div className="node-icon">💬</div>
        <div className="node-title">Teams</div>
      </div>
      <div className="node-content">
        <div className="node-label">{data?.label || 'Teams Channel'}</div>
        <div className="node-description">{data?.channel || 'General Channel'}</div>
        <div className="node-status">{data?.status || 'Connected'}</div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ background: '#6264a7' }}
        id="teams-output"
      />
    </div>
  );
};

export default memo(TeamsNode);