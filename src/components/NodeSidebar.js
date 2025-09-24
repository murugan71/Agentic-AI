import React, { useState, useEffect } from 'react';
import { getLanguageModels } from '../services/groqService.js';

const NodeSidebar = () => {
  const [languageModels, setLanguageModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // Fetch language models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoadingModels(true);
        const models = await getLanguageModels();
        setLanguageModels(models);
      } catch (error) {
        console.error('Failed to load language models:', error);
        // Fallback models will be used by the service
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadModels();
  }, []);

  const onDragStart = (event, nodeType, nodeData) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, data: nodeData }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const getNodeCategories = () => [
    {
      title: 'Agents',
      items: [
        {
          type: 'agent',
          icon: '🤖',
          title: 'AI Agent',
          description: 'Intelligent autonomous agent',
          data: { label: 'AI Agent', description: 'Tools Agent' }
        }
      ]
    },
    {
      title: 'Tools',
      items: [
        {
          type: 'tool',
          icon: '🔍',
          title: 'Web Search',
          description: 'Search the web for information',
          data: { label: 'Web Search', toolType: 'search', status: 'Ready' }
        },
        {
          type: 'tool',
          icon: '📊',
          title: 'Data Analysis',
          description: 'Analyze and process data',
          data: { label: 'Data Analysis', toolType: 'analysis', status: 'Ready' }
        },
        {
          type: 'tool',
          icon: '📝',
          title: 'Text Processing',
          description: 'Process and manipulate text',
          data: { label: 'Text Processing', toolType: 'text', status: 'Ready' }
        },
        {
          type: 'tool',
          icon: '📷',
          title: 'Image Processing',
          description: 'Analyze and process images',
          data: { label: 'Image Processing', toolType: 'image', status: 'Ready' }
        },
        {
          type: 'tool',
          icon: '🔧',
          title: 'API Tool',
          description: 'Custom API integration',
          data: { label: 'API Tool', toolType: 'api', status: 'Ready' }
        },
        {
          type: 'tool',
          icon: '📋',
          title: 'File Handler',
          description: 'Read and write files',
          data: { label: 'File Handler', toolType: 'file', status: 'Ready' }
        }
      ]
    },
    {
      title: 'Memory',
      items: [
        {
          type: 'memory',
          icon: '🧠',
          title: 'Vector Memory',
          description: 'Semantic vector storage',
          data: { label: 'Vector Memory', memoryType: 'vector', status: 'Ready' }
        },
        {
          type: 'memory',
          icon: '📚',
          title: 'Episodic Memory',
          description: 'Sequential episode storage',
          data: { label: 'Episodic Memory', memoryType: 'episodic', status: 'Ready' }
        },
        {
          type: 'memory',
          icon: '💾',
          title: 'Working Memory',
          description: 'Short-term context storage',
          data: { label: 'Working Memory', memoryType: 'working', status: 'Ready' }
        },
        {
          type: 'memory',
          icon: '🗂️',
          title: 'Knowledge Base',
          description: 'Structured knowledge storage',
          data: { label: 'Knowledge Base', memoryType: 'knowledge', status: 'Ready' }
        }
      ]
    },
    {
      title: 'Language Models',
      items: isLoadingModels 
        ? [
            {
              type: 'llm',
              icon: '⏳',
              title: 'Loading...',
              description: 'Fetching models from Groq API',
              data: { label: 'Loading...', model: 'loading', status: 'Loading' }
            }
          ]
        : languageModels
    },
    {
      title: 'Data Sources',
      items: [
        {
          type: 'database',
          icon: '🗄️',
          title: 'PostgreSQL',
          description: 'PostgreSQL Database',
          data: { label: 'PostgreSQL', type: 'PostgreSQL', status: 'Connected' }
        },
        {
          type: 'database',
          icon: '🗄️',
          title: 'MongoDB',
          description: 'MongoDB Database',
          data: { label: 'MongoDB', type: 'MongoDB', status: 'Connected' }
        },
        {
          type: 'database',
          icon: '🗄️',
          title: 'Redis',
          description: 'Redis Cache',
          data: { label: 'Redis', type: 'Redis', status: 'Connected' }
        }
      ]
    },
    {
      title: 'Communication',
      items: [
        {
          type: 'chat',
          icon: '💬',
          title: 'Chat Interface',
          description: 'Direct chat with AI Agent',
          data: { label: 'Chat Interface', type: 'chat', status: 'Ready' }
        },
        {
          type: 'gmail',
          icon: '📧',
          title: 'Gmail',
          description: 'Gmail Email Service',
          data: { label: 'Gmail API', account: 'Send/Receive Emails', status: 'Authenticated' }
        },
        {
          type: 'teams',
          icon: '💬',
          title: 'Teams',
          description: 'Microsoft Teams Channel',
          data: { label: 'Teams Channel', channel: 'General Channel', status: 'Connected' }
        },
        {
          type: 'teams',
          icon: '📱',
          title: 'Slack',
          description: 'Slack Workspace',
          data: { label: 'Slack Channel', channel: 'General', status: 'Connected' }
        }
      ]
    }
  ];

  return (
    <div className="node-sidebar">
      <div className="sidebar-title">🎯 AI Playground</div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
        Drag and drop components to build your AI workflow
      </div>
      
      {getNodeCategories().map((category, categoryIndex) => (
        <div key={categoryIndex} className="sidebar-section">
          <div className="sidebar-section-title">{category.title}</div>
          {category.items.map((item, itemIndex) => (
            <div
              key={itemIndex}
              className="node-item"
              draggable
              onDragStart={(event) => onDragStart(event, item.type, item.data)}
            >
              <div className="node-item-icon">{item.icon}</div>
              <div className="node-item-info">
                <div className="node-item-title">{item.title}</div>
                <div className="node-item-desc">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
      
      <div style={{ 
        marginTop: '30px', 
        padding: '10px', 
        background: '#e3f2fd', 
        borderRadius: '6px', 
        fontSize: '11px', 
        color: '#1976d2' 
      }}>
        💡 <strong>Tip:</strong> Connect Model (bottom left), Memory (bottom center), and Tool (bottom right) to Agents
      </div>
    </div>
  );
};

export default NodeSidebar;