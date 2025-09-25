// Connection validation logic for the AI playground
export const isValidConnection = (source, target, sourceHandle, targetHandle, nodes, edges) => {
  const sourceNode = nodes.find(n => n.id === source);
  const targetNode = nodes.find(n => n.id === target);
  
  if (!sourceNode || !targetNode) return false;

  const sourceType = sourceNode.type;
  const targetType = targetNode.type;

  // Agent-specific connection rules for outgoing connections
  if (sourceType === 'agent') {
    // Agent output can only connect to communication nodes
    if (sourceHandle === 'agent-output') {
      return ['gmail', 'teams', 'chat', 'output'].includes(targetType);
    }
    return false; // Agents should not have other outgoing connections
  }

  // Agent-specific connection rules
  if (targetType === 'agent') {
    // Tools and databases connect to agent's tool handle (bottom right)
    if ((sourceType === 'tool' || sourceType === 'database') && targetHandle === 'tool') {
      // Allow multiple tools to connect to agent's tool handle
      return true;
    }
    
    // LLM connects to agent's model handle (bottom left)
    if (sourceType === 'llm' && targetHandle === 'model') {
      // Check if agent already has a model connected
      const modelConnections = edges.filter(edge => 
        edge.target === target && edge.targetHandle === 'model'
      ).length;
      return modelConnections === 0;
    }
    
    // Memory connects to agent's memory handle (bottom center)
    if (sourceType === 'memory' && targetHandle === 'memory') {
      // Check if agent already has memory connected
      const memoryConnections = edges.filter(edge => 
        edge.target === target && edge.targetHandle === 'memory'
      ).length;
      return memoryConnections === 0;
    }
    
    // Agent input can only accept connections from communication nodes
    if (targetHandle === 'agent-input') {
      return ['gmail', 'teams', 'chat'].includes(sourceType);
    }
    
    return false; // No other connections allowed to agent
  }

  // LLM-specific connection rules - only one outgoing connection allowed
  if (sourceType === 'llm') {
    // Check if LLM already has an outgoing connection
    const existingConnections = edges.filter(edge => edge.source === source).length;
    if (existingConnections > 0) {
      return false; // LLM can only have one outgoing connection
    }
  }

  // Memory-specific connection rules - only one outgoing connection allowed
  if (sourceType === 'memory') {
    // Check if Memory already has an outgoing connection
    const existingConnections = edges.filter(edge => edge.source === source).length;
    if (existingConnections > 0) {
      return false; // Memory can only have one outgoing connection
    }
  }

  // Tool-specific connection rules - only one outgoing connection allowed
  if (sourceType === 'tool') {
    // Check if Tool already has an outgoing connection
    const existingConnections = edges.filter(edge => edge.source === source).length;
    if (existingConnections > 0) {
      return false; // Tool can only have one outgoing connection
    }
  }

  // Database-specific connection rules - only one outgoing connection allowed
  if (sourceType === 'database') {
    // Check if Database already has an outgoing connection
    const existingConnections = edges.filter(edge => edge.source === source).length;
    if (existingConnections > 0) {
      return false; // Database can only have one outgoing connection
    }
  }

  // Define other valid connection rules
  const connectionRules = {
    // Tools can connect to agents (specific handles) and databases
    tool: ['agent', 'database'],
    
    // LLMs can only connect to agents (via model handle)
    llm: ['agent'],
    
    // Memory can only connect to agents (specific handle)
    memory: ['agent'],
    
    // Databases can connect to tools and agents (via tool handle)
    database: ['tool', 'agent'],
    
    // Communication tools can connect to agents via agent-input only
    gmail: ['agent'],
    teams: ['agent'],
    chat: ['agent'],
    
    // Agents can only connect to communication nodes via agent-output
    agent: ['gmail', 'teams', 'chat', 'output'],
  };

  // Check if connection is allowed for non-agent targets
  return connectionRules[sourceType]?.includes(targetType) || false;
};

// Get connection validation message
export const getConnectionMessage = (source, target, sourceHandle, targetHandle, nodes, edges) => {
  const sourceNode = nodes.find(n => n.id === source);
  const targetNode = nodes.find(n => n.id === target);
  
  if (!sourceNode || !targetNode) return 'Invalid connection';

  const sourceType = sourceNode.type;
  const targetType = targetNode.type;

  // Handle agent output connection messages
  if (sourceType === 'agent' && sourceHandle === 'agent-output') {
    if (!['gmail', 'teams', 'chat', 'output'].includes(targetType)) {
      return 'Agent output can only connect to communication nodes (Gmail, Teams, Chat, or Output Display)';
    }
  }

  if (targetType === 'agent') {
    if (sourceType === 'tool') {
      if (targetHandle !== 'tool') {
        return 'Tools must connect to agent tool handle (bottom right)';
      }
      // Multiple tools can connect to agent
    }
    
    if (sourceType === 'database') {
      if (targetHandle !== 'tool') {
        return 'Databases must connect to agent tool handle (bottom right)';
      }
      // Multiple databases can connect to agent
    }
    
    if (sourceType === 'llm') {
      if (targetHandle !== 'model') {
        return 'Models must connect to agent model handle (bottom left)';
      }
      const modelConnections = edges.filter(edge => 
        edge.target === target && edge.targetHandle === 'model'
      ).length;
      if (modelConnections > 0) {
        return 'Agent already has a model connected';
      }
    }
    
    if (sourceType === 'memory') {
      if (targetHandle !== 'memory') {
        return 'Memory must connect to agent memory handle (bottom center)';
      }
      const memoryConnections = edges.filter(edge => 
        edge.target === target && edge.targetHandle === 'memory'
      ).length;
      if (memoryConnections > 0) {
        return 'Agent already has memory connected';
      }
    }
    
    if (targetHandle === 'agent-input') {
      if (!['gmail', 'teams', 'chat'].includes(sourceType)) {
        return 'Agent input can only accept connections from communication nodes (Gmail, Teams, or Chat)';
      }
    }
  }

  // Output node validation - only accepts connections from agents
  if (targetType === 'output') {
    if (sourceType !== 'agent') {
      return 'Output Display can only accept connections from agents';
    }
    if (sourceHandle !== 'agent-output') {
      return 'Output Display must connect to agent output handle';
    }
    if (targetHandle !== 'input') {
      return 'Output Display input must be connected via the left handle';
    }
  }

  // Check for LLM one-at-a-time constraint
  if (sourceType === 'llm') {
    const existingConnections = edges.filter(edge => edge.source === source).length;
    if (existingConnections > 0) {
      return 'Language models can only connect to one target at a time';
    }
    
    // Check if LLM is trying to connect to invalid target
    if (targetType !== 'agent') {
      return 'Language models can only connect to agents (chat models)';
    }
  }

  // Check for Memory one-at-a-time constraint
  if (sourceType === 'memory') {
    const existingConnections = edges.filter(edge => edge.source === source).length;
    if (existingConnections > 0) {
      return 'Memory nodes can only connect to one target at a time';
    }
  }

  // Check for Tool one-at-a-time constraint
  if (sourceType === 'tool') {
    const existingConnections = edges.filter(edge => edge.source === source).length;
    if (existingConnections > 0) {
      return 'Tool nodes can only connect to one target at a time';
    }
  }

  // Check for Database one-at-a-time constraint
  if (sourceType === 'database') {
    const existingConnections = edges.filter(edge => edge.source === source).length;
    if (existingConnections > 0) {
      return 'Database nodes can only connect to one target at a time';
    }
  }

  if (sourceType === targetType) {
    return `Cannot connect ${sourceType} to another ${targetType}`;
  }

  if (['gmail', 'teams', 'chat'].includes(sourceType) && targetType === 'database') {
    return 'Communication tools cannot directly connect to databases';
  }

  return 'Connection allowed';
};

// Define node categories for better organization
export const nodeCategories = {
  core: ['agent'],
  ai: ['llm'],
  data: ['database'],
  communication: ['gmail', 'teams', 'chat', 'output'],
  tools: ['tool'],
  memory: ['memory']
};

// Get node category
export const getNodeCategory = (nodeType) => {
  for (const [category, types] of Object.entries(nodeCategories)) {
    if (types.includes(nodeType)) return category;
  }
  return 'unknown';
};