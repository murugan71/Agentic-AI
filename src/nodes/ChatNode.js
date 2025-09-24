import React, { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

const ChatNode = ({ data, isConnectable, id }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: 'Chat interface ready. Connect to an AI Agent to start messaging.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  // Listen for incoming messages from agents
  useEffect(() => {
    if (data?.incomingMessage && data.incomingMessage.id !== messages[messages.length - 1]?.id) {
      setMessages(prev => [...prev, data.incomingMessage]);
    }
  }, [data?.incomingMessage, messages]);

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Check if we have the function and if there are any connections first
    if (data?.sendMessageToConnectedAgents && data?.hasConnections && id) {
      data.sendMessageToConnectedAgents(id, userMessage.content);
      
      // Add a system message indicating the message was sent to the agent
      const systemMessage = {
        id: Date.now() + 1,
        type: 'system',
        content: `Message sent to connected agent...`,
        timestamp: new Date()
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, systemMessage]);
      }, 100);
    } else {
      // Fallback behavior when no agents are connected
      const systemMessage = {
        id: Date.now() + 1,
        type: 'system',
        content: `No agents connected. Message: "${userMessage.content}"`,
        timestamp: new Date()
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, systemMessage]);
      }, 500);
    }

    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      sendMessage();
    }
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="chat-node">
      <div className="node-header">
        <div className="node-icon">💬</div>
        <div className="node-title">Chat Interface</div>
      </div>
      
      <div className="node-content">
        <div className="node-label">{data?.label || 'Chat Interface'}</div>
        <div className="node-description">{data?.type || 'Direct communication'}</div>
        <div className="node-status">{data?.status || 'Ready'}</div>
        
        {/* Chat Messages Display */}
        <div 
          className="chat-messages-display"
          onClick={(e) => e.stopPropagation()}
        >
          {messages.slice(-3).map((message) => (
            <div key={message.id} className={`mini-message ${message.type}-message`}>
              <span className="message-indicator">
                {message.type === 'user' ? '👤' : message.type === 'system' ? 'ℹ️' : '🤖'}
              </span>
              <span className="message-text">
                {message.content.length > 40 
                  ? message.content.substring(0, 40) + '...' 
                  : message.content}
              </span>
            </div>
          ))}
        </div>
        
        {/* Chat Input */}
        <div 
          className="chat-input-container-mini"
          onClick={(e) => e.stopPropagation()}
        >
          <input 
            type="text" 
            className="chat-input-mini"
            placeholder={data?.hasConnections ? "Type message to agent..." : "Connect to an agent first..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
          />
          <button 
            className="chat-send-btn-mini" 
            onClick={(e) => {
              e.stopPropagation();
              sendMessage();
            }}
            title={data?.hasConnections ? "Send to connected agent" : "No agent connected"}
          >
            ➤
          </button>
        </div>
      </div>
      
      {/* Output Handle - Right Side (sends to agent) */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ background: '#00bcd4' }}
        id="chat-output"
      />
    </div>
  );
};

export default memo(ChatNode);