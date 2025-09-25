import React, { useState } from 'react';

const NodeConfigPanel = ({ node, onUpdate, onClose }) => {
  const [config, setConfig] = useState(node?.data || {});

  if (!node) return null;

  const handleConfigChange = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate(node.id, newConfig);
  };

  const handleKeyDown = (e) => {
    // Prevent keydown events from propagating to the parent Flow component
    // This prevents accidental node deletion when typing in input fields
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.stopPropagation();
    }
  };

  const renderConfigFields = () => {
    switch (node.type) {
      case 'agent':
        return (
          <>
            <div className="config-field">
              <label>Agent Name</label>
              <input
                type="text"
                value={config.label || ''}
                onChange={(e) => handleConfigChange('label', e.target.value)}
                placeholder="Enter agent name"
              />
            </div>
            <div className="config-field">
              <label>Description</label>
              <textarea
                value={config.description || ''}
                onChange={(e) => handleConfigChange('description', e.target.value)}
                placeholder="Describe the agent's purpose"
                rows={3}
              />
            </div>
            <div className="config-field">
              <label>Instructions</label>
              <textarea
                value={config.instructions || ''}
                onChange={(e) => handleConfigChange('instructions', e.target.value)}
                placeholder="Agent instructions and behavior"
                rows={4}
              />
            </div>
          </>
        );
      
      case 'llm':
        // Check if this is a GPT Models node from OpenAI
        const isGPTModelsNode = config.provider === 'OpenAI' && config.label === 'GPT Models';
        
        return (
          <>
            {/* Show Model Name dropdown only for GPT Models */}
            {isGPTModelsNode && (
              <div className="config-field">
                <label>Model Name</label>
                <select
                  value={config.model || 'gpt-4o'}
                  onChange={(e) => handleConfigChange('model', e.target.value)}
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                </select>
              </div>
            )}
            <div className="config-field">
              <label>Agent Provider</label>
              <select
                value={config.agent || (isGPTModelsNode ? 'openai' : 'groq')}
                onChange={(e) => handleConfigChange('agent', e.target.value)}
              >
                <option value="groq">Groq</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
            <div className="config-field">
              <label>API Key</label>
              <input
                type="password"
                value={config.apiKey || ''}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                placeholder="Enter API key"
              />
            </div>
            <div className="config-field">
              <label>Temperature</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature || 0.7}
                onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
              />
              <span>{config.temperature || 0.7}</span>
            </div>
            <div className="config-field">
              <label>Max Tokens</label>
              <input
                type="number"
                value={config.maxTokens || 1000}
                onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                placeholder="Maximum tokens"
              />
            </div>
          </>
        );
      
      case 'database':
        return (
          <>
            <div className="config-field">
              <label>Database Type</label>
              <select
                value={config.type || 'PostgreSQL'}
                onChange={(e) => handleConfigChange('type', e.target.value)}
              >
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="MongoDB">MongoDB</option>
                <option value="MySQL">MySQL</option>
                <option value="Redis">Redis</option>
              </select>
            </div>
            <div className="config-field">
              <label>Connection String</label>
              <input
                type="password"
                value={config.connectionString || ''}
                onChange={(e) => handleConfigChange('connectionString', e.target.value)}
                placeholder="Database connection string"
              />
            </div>
            <div className="config-field">
              <label>Database Name</label>
              <input
                type="text"
                value={config.database || ''}
                onChange={(e) => handleConfigChange('database', e.target.value)}
                placeholder="Database name"
              />
            </div>
          </>
        );
      
      case 'gmail':
        return (
          <>
            <div className="config-field">
              <label>Gmail Account</label>
              <input
                type="email"
                value={config.account || ''}
                onChange={(e) => handleConfigChange('account', e.target.value)}
                placeholder="Gmail account"
              />
            </div>
            <div className="config-field">
              <label>OAuth Token</label>
              <input
                type="password"
                value={config.oauthToken || ''}
                onChange={(e) => handleConfigChange('oauthToken', e.target.value)}
                placeholder="OAuth access token"
              />
            </div>
            <div className="config-field">
              <label>Permissions</label>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.canRead || false}
                    onChange={(e) => handleConfigChange('canRead', e.target.checked)}
                  />
                  Read emails
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={config.canSend || false}
                    onChange={(e) => handleConfigChange('canSend', e.target.checked)}
                  />
                  Send emails
                </label>
              </div>
            </div>
          </>
        );
      
      case 'teams':
        return (
          <>
            <div className="config-field">
              <label>Team Name</label>
              <input
                type="text"
                value={config.team || ''}
                onChange={(e) => handleConfigChange('team', e.target.value)}
                placeholder="Team name"
              />
            </div>
            <div className="config-field">
              <label>Channel</label>
              <input
                type="text"
                value={config.channel || ''}
                onChange={(e) => handleConfigChange('channel', e.target.value)}
                placeholder="Channel name"
              />
            </div>
            <div className="config-field">
              <label>Webhook URL</label>
              <input
                type="url"
                value={config.webhookUrl || ''}
                onChange={(e) => handleConfigChange('webhookUrl', e.target.value)}
                placeholder="Teams webhook URL"
              />
            </div>
          </>
        );
      
      case 'chat':
        return (
          <>
            <div className="config-field">
              <label>Chat Interface Name</label>
              <input
                type="text"
                value={config.label || ''}
                onChange={(e) => handleConfigChange('label', e.target.value)}
                placeholder="Enter chat interface name"
              />
            </div>
            <div className="config-field">
              <label>Welcome Message</label>
              <textarea
                value={config.welcomeMessage || ''}
                onChange={(e) => handleConfigChange('welcomeMessage', e.target.value)}
                placeholder="Custom welcome message for users"
                rows={2}
              />
            </div>
            <div className="config-field">
              <label>Auto-Response</label>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.autoResponse || false}
                    onChange={(e) => handleConfigChange('autoResponse', e.target.checked)}
                  />
                  Enable automatic responses
                </label>
              </div>
            </div>
            <div className="config-field">
              <label>Message History Limit</label>
              <input
                type="number"
                value={config.historyLimit || 50}
                onChange={(e) => handleConfigChange('historyLimit', parseInt(e.target.value))}
                placeholder="Max messages to store"
                min="10"
                max="1000"
              />
            </div>
          </>
        );
      
      default:
        return <div>No configuration available for this node type.</div>;
    }
  };

  return (
    <div className="config-panel-overlay" onClick={onClose}>
      <div className="config-panel" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="config-header">
          <h3>Configure {node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="config-content">
          {renderConfigFields()}
        </div>
        <div className="config-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={onClose}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default NodeConfigPanel;