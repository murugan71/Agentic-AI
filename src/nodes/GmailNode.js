import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const GmailNode = ({ data, isConnectable }) => {
  return (
    <div className="gmail-node">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={{ background: '#ea4335' }}
        id="gmail-input"
      />
      <div className="node-header">
        <div className="node-icon">📧</div>
        <div className="node-title">Gmail</div>
      </div>
      <div className="node-content">
        <div className="node-label">{data?.label || 'Gmail API'}</div>
        <div className="node-description">{data?.account || 'Send/Receive Emails'}</div>
        <div className="node-status">{data?.status || 'Authenticated'}</div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ background: '#ea4335' }}
        id="gmail-output"
      />
    </div>
  );
};

export default memo(GmailNode);