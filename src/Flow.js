import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';

import 'reactflow/dist/style.css';
import './nodes/nodes.css';
import { nodeTypes } from './nodes/index.js';
import NodeSidebar from './components/NodeSidebar.js';
import NodeConfigPanel from './components/NodeConfigPanel.js';
import ErrorBoundary from './components/ErrorBoundary.js';
import { isValidConnection, getConnectionMessage } from './utils/connectionValidation.js';
import { callAgentAPI } from './services/groqService.js';

// Suppress ResizeObserver errors - these are harmless but annoying
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// More comprehensive ResizeObserver error handling
const suppressResizeObserverErrors = () => {
  // Override console.error
  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('ResizeObserver loop completed with undelivered notifications') ||
       args[0].includes('ResizeObserver loop limit exceeded'))
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  // Handle window errors
  const handleError = (event) => {
    if (
      event.message && 
      (event.message.includes('ResizeObserver loop completed with undelivered notifications') ||
       event.message.includes('ResizeObserver loop limit exceeded'))
    ) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  };

  // Handle unhandled promise rejections
  const handleRejection = (event) => {
    if (
      event.reason && 
      event.reason.message && 
      (event.reason.message.includes('ResizeObserver loop completed with undelivered notifications') ||
       event.reason.message.includes('ResizeObserver loop limit exceeded'))
    ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  };

  window.addEventListener('error', handleError, true);
  window.addEventListener('unhandledrejection', handleRejection, true);

  // Also patch the ResizeObserver constructor to add debouncing
  if (window.ResizeObserver) {
    const OriginalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class extends OriginalResizeObserver {
      constructor(callback) {
        const debouncedCallback = debounce((entries, observer) => {
          try {
            callback(entries, observer);
          } catch (error) {
            if (
              error.message && 
              (error.message.includes('ResizeObserver loop completed with undelivered notifications') ||
               error.message.includes('ResizeObserver loop limit exceeded'))
            ) {
              // Silently ignore ResizeObserver errors
              return;
            }
            throw error;
          }
        }, 16); // 16ms debounce for 60fps
        
        super(debouncedCallback);
      }
    };
  }
};

// Initialize error suppression
suppressResizeObserverErrors();

const initialNodes = [
  {
    id: 'agent-initial',
    type: 'agent',
    position: { x: 400, y: 200 },
    data: {
      label: 'Agent AI',
      name: 'Agent AI',
      model: '',
      memory: '',
      tools: [],
      systemPrompt: 'You are a helpful AI assistant.',
      processing: false
    }
  }
];

function Flow() {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, defaultOnEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [dragOverActive, setDragOverActive] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // 'info', 'success', 'error'

  // Helper function to show message with type - wrapped in useCallback to avoid dependency issues
  const showMessage = useCallback((message, type = 'info', duration = 3000) => {
    setConnectionMessage(message);
    setMessageType(type);
    setTimeout(() => setConnectionMessage(''), duration);
  }, []);
  
  // Custom edge change handler to clean up agent data when LLM connections are removed
  const onEdgesChange = useCallback((changes) => {
    changes.forEach((change) => {
      if (change.type === 'remove') {
        const edge = edges.find(e => e.id === change.id);
        if (edge) {
          // Check if this was an LLM -> Agent connection
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          
          if (sourceNode?.type === 'llm' && targetNode?.type === 'agent' && edge.targetHandle === 'model') {
            console.log("🔌 Disconnecting LLM from agent:", targetNode.id);
            
            // Clean up agent data - reset status
            setNodes((nds) =>
              nds.map((node) =>
                node.id === targetNode.id
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        model: '',
                        initialized: false,
                        initializing: false,
                        processing: false
                      }
                    }
                  : node
              )
            );
            
            showMessage('LLM disconnected from agent', 'info', 2000);
          }
        }
      }
    });
    
    // Apply the default edge changes
    defaultOnEdgesChange(changes);
  }, [edges, nodes, setNodes, defaultOnEdgesChange, showMessage]);

  // Handle ResizeObserver errors gracefully
  useEffect(() => {
    const handleResize = debounce(() => {
      // Trigger a gentle re-render to help with layout issues
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ duration: 0 });
      }
    }, 100);

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [reactFlowInstance]);

  // Helper function to get edge color based on source node type
  const getEdgeColor = useCallback((sourceId) => {
    const sourceNode = nodes.find(n => n.id === sourceId);
    if (!sourceNode) return '#b1b1b7';
    
    const colorMap = {
      agent: '#ff6b6b',
      llm: '#4285f4',
      database: '#34a853',
      gmail: '#ea4335',
      teams: '#6264a7',
      tool: '#4caf50',
      memory: '#ff9800',
      chat: '#00bcd4'
    };
    
    return colorMap[sourceNode.type] || '#b1b1b7';
  }, [nodes]);

  // Keyboard shortcut handler for deleting nodes and edges
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Don't delete nodes when user is typing in an input field
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.contentEditable === 'true' ||
          activeElement.isContentEditable ||
          activeElement.closest('.config-panel') ||
          activeElement.closest('.chat-input-container-mini') ||
          activeElement.closest('input') ||
          activeElement.closest('textarea')
        );
        
        if (isTyping) {
          return; // Let the input field handle the backspace/delete
        }
        
        event.preventDefault();
        
        if (selectedEdge) {
          // Check if this was an LLM -> Agent connection and clean up
          const sourceNode = nodes.find(n => n.id === selectedEdge.source);
          const targetNode = nodes.find(n => n.id === selectedEdge.target);
          
          if (sourceNode?.type === 'llm' && targetNode?.type === 'agent' && selectedEdge.targetHandle === 'model') {
            console.log("🔌 Disconnecting LLM from agent via keyboard:", targetNode.id);
            
            // Clean up agent data - reset status
            setNodes((nds) =>
              nds.map((node) =>
                node.id === targetNode.id
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        model: '',
                        initialized: false,
                        initializing: false,
                        processing: false
                      }
                    }
                  : node
              )
            );
            
            showMessage('LLM disconnected from agent', 'info', 2000);
          }
          
          // Delete selected edge
          setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id));
          setSelectedEdge(null);
          showMessage('Connection deleted successfully', 'success', 2000);
        } else if (selectedNode) {
          // Delete selected node and its connections
          setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
          setEdges((eds) => eds.filter((edge) => 
            edge.source !== selectedNode.id && edge.target !== selectedNode.id
          ));
          setSelectedNode(null);
          setShowConfigPanel(false);
          showMessage('Node and its connections deleted successfully', 'success', 2000);
        }
      }
      
      if (event.key === 'Escape') {
        setSelectedNode(null);
        setSelectedEdge(null);
        setShowConfigPanel(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNode, selectedEdge, setNodes, setEdges, showMessage, nodes]);  const onConnect = useCallback(
    async (params) => {
      // Validate connection before adding
      if (isValidConnection(params.source, params.target, params.sourceHandle, params.targetHandle, nodes, edges)) {
        setEdges((eds) => addEdge({ 
          ...params, 
          animated: true,
          style: { 
            strokeWidth: 2,
            stroke: getEdgeColor(params.source)
          },
          type: 'bezier'
        }, eds));
        
        // Check if this is an LLM connecting to an Agent's model handle
        const sourceNode = nodes.find(n => n.id === params.source);
        const targetNode = nodes.find(n => n.id === params.target);
        
        if (sourceNode?.type === 'llm' && targetNode?.type === 'agent' && params.targetHandle === 'model') {
          // Initialize the agent with the connected LLM model
          try {
            const selectedModel = sourceNode.data?.model || sourceNode.data?.label || 'llama3-8b-8192';
            const llmApiKey = sourceNode.data?.apiKey;
            
            // Check if LLM node has API key configured
            if (!llmApiKey) {
              showMessage('Warning: LLM node has no API key configured. Please add an API key in the LLM node settings.', 'warning', 5000);
            }
            
            // Set agent to initializing state
            setNodes((nds) => 
              nds.map((node) => 
                node.id === params.target 
                  ? { 
                      ...node, 
                      data: { 
                        ...node.data, 
                        initializing: true,
                        model: selectedModel,
                        status: `Initializing agent with ${selectedModel}...`
                      } 
                    }
                  : node
              )
            );
            
            // Set agent as initialized (no need for client-side LLM initialization since we use callAgentAPI)
            setNodes((nds) => 
              nds.map((node) => 
                node.id === params.target 
                  ? { 
                      ...node, 
                      data: { 
                        ...node.data, 
                        initializing: false,
                        initialized: true,
                        status: 'Agent ready'
                      } 
                    }
                  : node
              )
            );
            
            showMessage(`Agent initialized with ${selectedModel} model`, 'success', 3000);
          } catch (error) {
            console.error('Failed to initialize agent:', error);
            
            // Update agent state to show error
            setNodes((nds) => 
              nds.map((node) => 
                node.id === params.target 
                  ? { 
                      ...node, 
                      data: { 
                        ...node.data, 
                        initializing: false,
                        initialized: false,
                        status: 'Initialization failed'
                      } 
                    }
                  : node
              )
            );
            
            showMessage('Failed to initialize agent. Check console for details.', 'error', 5000);
          }
        } else {
          showMessage('Connection created successfully', 'success', 2000);
        }
      } else {
        const message = getConnectionMessage(params.source, params.target, params.sourceHandle, params.targetHandle, nodes, edges);
        showMessage(message, 'error', 3000);
      }
    },
    [setEdges, nodes, edges, getEdgeColor, showMessage, setNodes],
  );

  const onConnectStart = useCallback(() => {
    setConnectionMessage('');
  }, []);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    // Don't show config panel for chat nodes, output nodes, and tool nodes
    if (node.type !== 'chat' && node.type !== 'output' && node.type !== 'tool') {
      setShowConfigPanel(true);
    } else {
      setShowConfigPanel(false);
    }
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
    setSelectedNode(null);
    setShowConfigPanel(false);
    
    // Update edge styling to show selection
    setEdges((eds) => eds.map((e) => ({
      ...e,
      className: e.id === edge.id ? 'selected' : ''
    })));
    
    showMessage('Connection selected - Press Delete to remove', 'info', 3000);
  }, [setEdges, showMessage]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setShowConfigPanel(false);
    
    // Clear edge selection styling
    setEdges((eds) => eds.map((e) => ({
      ...e,
      className: ''
    })));
  }, [setEdges]);

  const onConfigUpdate = useCallback((nodeId, newData) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  }, [setNodes]);

  // Message handling functionality
  const sendMessageToConnectedAgents = useCallback(async (sourceNodeId, message) => {
    // Find all edges where the source is the chat node
    const connectedEdges = edges.filter(edge => 
      edge.source === sourceNodeId && edge.sourceHandle === 'chat-output'
    );

    // Check if there are any connected agents
    if (connectedEdges.length === 0) {
      showMessage('No connected agents found', 'info', 2000);
      return;
    }

    let processedAgents = 0;
    let totalAgents = 0;

    // Process each connected agent
    for (const edge of connectedEdges) {
      const targetNodeId = edge.target;
      const targetNode = nodes.find(node => node.id === targetNodeId);
      
      if (targetNode && targetNode.type === 'agent') {
        totalAgents++;
        
        // Set agent to processing state and also connected LLM nodes
        const connectedLLMNodes = edges
          .filter(edge => edge.target === targetNodeId && edge.targetHandle === 'model')
          .map(edge => edge.source);
        
        setNodes((nds) => 
          nds.map((node) => {
            if (node.id === targetNodeId) {
              // Set agent to processing
              return { ...node, data: { ...node.data, processing: true, lastMessage: message } };
            } else if (connectedLLMNodes.includes(node.id) && node.type === 'llm') {
              // Set connected LLM to processing
              return { ...node, data: { ...node.data, processing: true } };
            }
            return node;
          })
        );

        try {
          // Check if agent has a connected LLM model and is properly initialized
          if (targetNode.data?.initialized && targetNode.data?.model) {
            console.log("🤖 Processing message through agent:", targetNodeId);
            
            // Find the connected LLM node to get the actual selected model
            const connectedLLMEdge = edges.find(edge => 
              edge.target === targetNodeId && edge.targetHandle === 'model'
            );
            const connectedLLMNode = connectedLLMEdge ? 
              nodes.find(node => node.id === connectedLLMEdge.source) : null;
            
            // Get agent configuration - use the LLM node's selected model if available
            const agentModel = connectedLLMNode?.data?.model || 
                              connectedLLMNode?.data?.selectedModel || 
                              targetNode.data?.model || 
                              'llama3-8b-8192';
            const temperature = targetNode.data?.temperature || 0.2;
            // Get agent provider from the connected LLM node, fallback to targetNode, then default to 'groq'
            const agent = connectedLLMNode?.data?.agent || 
                         targetNode.data?.agent || 
                         'groq';
            
            // Get API key from the connected LLM node
            const apiKey = connectedLLMNode?.data?.apiKey || 
                          targetNode.data?.apiKey || 
                          process.env.REACT_APP_GROQ_API_KEY;
            
            // Find connected tools for this agent
            const connectedToolEdges = edges.filter(edge => 
              edge.target === targetNodeId && edge.targetHandle === 'tool'
            );
            const connectedTools = connectedToolEdges
              .map(edge => nodes.find(node => node.id === edge.source))
              .filter(node => node && node.type === 'tool')
              .map(toolNode => toolNode.data?.label || 'Unknown Tool');
            
            console.log("🔍 Using model from LLM node:", agentModel);
            console.log("🤖 Using agent provider:", agent);
            console.log("🛠️ Connected tools for agent:", connectedTools);
            console.log("🔑 Using API key from:", connectedLLMNode?.data?.apiKey ? "LLM node" : 
                       targetNode.data?.apiKey ? "Agent node" : "Environment variable");
            
            // Check if API key is available
            if (!apiKey) {
              showMessage('No API key found. Please configure the API key in the LLM node.', 'error', 4000);
              continue; // Skip this agent and continue with others
            }
            
            // Process message through Agent API
            const result = await callAgentAPI({
              userInput: message,
              apiKey: apiKey,
              agent: agent,
              temperature: temperature,
              modelName: agentModel,
              tools: connectedTools
            });
            
            if (result && result.response) {
              processedAgents++;
              
              // Create response message (but don't send to chat node anymore)
              const responseMessage = {
                id: Date.now() + Math.random(),
                type: 'agent',
                content: result.response,
                timestamp: new Date(),
                agentId: targetNodeId
              };

              // Send output to any connected output display nodes
              const outputConnections = edges.filter(edge => 
                edge.source === targetNodeId && edge.sourceHandle === 'agent-output'
              );
              
              if (outputConnections.length > 0) {
                setNodes((nds) => 
                  nds.map((node) => {
                    // Check if this node is a target of any output connections
                    const isOutputTarget = outputConnections.some(conn => conn.target === node.id);
                    if (isOutputTarget && node.type === 'output') {
                      return { 
                        ...node, 
                        data: { 
                          ...node.data, 
                          input: result.response,
                          lastUpdated: new Date().toISOString()
                        } 
                      };
                    }
                    return node;
                  })
                );
              }

              if (processedAgents === 1) {
                showMessage(`Agent processed message successfully`, 'success', 2000);
              }
            } else {
              // Handle error - callAgentAPI doesn't return success/error format like processMessage
              showMessage(`Agent error: No response received`, 'error', 3000);
            }
          } else if (targetNode.data?.model && !targetNode.data?.initialized) {
            // Agent has LLM but is not initialized yet
            showMessage('Agent is still initializing', 'warning', 2000);
          } else {
            // Agent doesn't have an LLM connected or lost connection
            showMessage('Agent has no LLM model connected', 'warning', 2000);
          }
        } catch (error) {
          console.error("Error processing message:", error);
          showMessage(`Processing error: ${error.message}`, 'error', 3000);
        } finally {
          // Remove processing state after 1 second from both agent and connected LLM nodes
          setTimeout(() => {
            const connectedLLMNodes = edges
              .filter(edge => edge.target === targetNodeId && edge.targetHandle === 'model')
              .map(edge => edge.source);
            
            setNodes((nds) => 
              nds.map((node) => {
                if (node.id === targetNodeId) {
                  // Remove processing from agent
                  return { ...node, data: { ...node.data, processing: false } };
                } else if (connectedLLMNodes.includes(node.id) && node.type === 'llm') {
                  // Remove processing from connected LLM
                  return { ...node, data: { ...node.data, processing: false } };
                }
                return node;
              })
            );
          }, 1000);
        }
      }
    }

    // Show final status message only if there were actual agent nodes
    if (totalAgents > 0) {
      if (processedAgents > 0) {
        showMessage(`Message sent to ${totalAgents} agent(s), ${processedAgents} processed successfully`, 'info', 2000);
      } else {
        showMessage(`Message sent to ${totalAgents} agent(s), but none were ready to process`, 'warning', 2000);
      }
    }
  }, [edges, nodes, setNodes, showMessage]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverActive(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOverActive(false);
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      setDragOverActive(false);

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeData = JSON.parse(event.dataTransfer.getData('application/reactflow'));

      // Check if the dropped element is valid
      if (typeof nodeData === 'undefined' || !nodeData) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `${nodeData.type}-${Date.now()}`,
        type: nodeData.type,
        position,
        data: nodeData.data,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  return (
    <div className="playground-container">
      <NodeSidebar />
      <div className="flow-container" ref={reactFlowWrapper}>
        {connectionMessage && (
          <div className={`connection-message ${messageType}`}>
            {messageType === 'success' ? '✅' : messageType === 'error' ? '❌' : 'ℹ️'} {connectionMessage}
          </div>
        )}
        <ErrorBoundary>
          <ReactFlow
            nodes={nodes.map(node => ({
              ...node,
              data: {
                ...node.data,
                sendMessageToConnectedAgents: node.type === 'chat' ? sendMessageToConnectedAgents : undefined,
                hasConnections: node.type === 'chat' ? edges.some(edge => 
                  edge.source === node.id && edge.sourceHandle === 'chat-output'
                ) : undefined
              }
            }))}
            edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          nodeTypes={nodeTypes}
          isValidConnection={(connection) => 
            isValidConnection(connection.source, connection.target, connection.sourceHandle, connection.targetHandle, nodes, edges)
          }
          className={dragOverActive ? 'drop-active' : ''}
          defaultEdgeOptions={{
            animated: true,
            style: { strokeWidth: 2 },
            type: 'bezier',
          }}
          connectionLineStyle={{ 
            strokeWidth: 2, 
            stroke: '#b1b1b7',
            strokeDasharray: '5,5'
          }}
          fitView
          fitViewOptions={{ duration: 200, padding: 0.1 }}
          deleteKeyCode={['Delete', 'Backspace']}
          selectNodesOnDrag={false}
          panOnScroll={true}
          panOnScrollSpeed={0.5}
          zoomOnScroll={true}
          zoomOnPinch={true}
          preventScrolling={false}
          attributionPosition="top-right"
        >
          <Controls />
          <MiniMap 
            nodeStrokeColor={(n) => {
              if (n.type === 'agent') return '#ff6b6b';
              if (n.type === 'llm') return '#4285f4';
              if (n.type === 'database') return '#34a853';
              if (n.type === 'gmail') return '#ea4335';
              if (n.type === 'teams') return '#6264a7';
              if (n.type === 'chat') return '#00bcd4';
              return '#ddd';
            }}
            nodeColor={(n) => {
              if (n.type === 'agent') return '#fff5f5';
              if (n.type === 'llm') return '#f0f7ff';
              if (n.type === 'database') return '#f0fff4';
              if (n.type === 'gmail') return '#fff5f5';
              if (n.type === 'teams') return '#f8f7ff';
              if (n.type === 'chat') return '#e0f2f1';
              return '#fff';
            }}
          />
          <Background variant="dots" gap={20} size={1} />
        </ReactFlow>
        </ErrorBoundary>
      </div>
      
      {showConfigPanel && (
        <NodeConfigPanel
          node={selectedNode}
          onUpdate={onConfigUpdate}
          onClose={() => setShowConfigPanel(false)}
        />
      )}
    </div>
  );
}

export default Flow;