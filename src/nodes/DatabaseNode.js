import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const DatabaseNode = ({ data, isConnectable }) => {
  return (
    <div className="database-node">
      {/* Single Handle for both input and output */}
      <Handle
        type="source"
        position={Position.Left}
        isConnectable={isConnectable}
        style={{ background: '#34a853' }}
        id="database-connection"
      />
      <div className="node-header">
        <div className="node-icon">🗄️</div>
        <div className="node-title">Database</div>
      </div>
      <div className="node-content">
        <div className="node-label">{data?.label || 'Database'}</div>
        <div className="node-description">{data?.type || 'PostgreSQL'}</div>
        <div className="node-status">{data?.status || 'Connected'}</div>
      </div>
    </div>
  );
};

export default memo(DatabaseNode);