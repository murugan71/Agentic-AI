const GROQ_API_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY; // Use environment variable
 
/**
 * Fetch available models from Groq API
 * @returns {Promise<Array>} Array of model objects
 */
export const fetchGroqModels = async () => {
  try {
    const response = await fetch(`${GROQ_API_BASE_URL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
 
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
 
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Groq models:', error);
    // Return fallback models if API fails
    return getFallbackModels();
  }
};
 
/**
 * Filter models to include only language models suitable for text generation
 * Excludes audio models (whisper), guard models, TTS models, etc.
 * @param {Array} models - Raw models from API
 * @returns {Array} Filtered language models
 */
export const filterLanguageModels = (models) => {
  const excludePatterns = [
    /whisper/i,           // Audio transcription models
    /guard/i,             // Content filtering models
    /tts/i,               // Text-to-speech models
    /prompt-guard/i,      // Prompt filtering models
  ];
 
  return models.filter(model => {
    // Check if model ID contains any excluded patterns
    const shouldExclude = excludePatterns.some(pattern =>
      pattern.test(model.id)
    );
   
    // Only include active models that are not in the exclude list
    return model.active && !shouldExclude;
  });
};
 
/**
 * Convert raw model data to the format expected by NodeSidebar
 * @param {Array} models - Filtered models from API
 * @returns {Array} Formatted models for sidebar
 */
export const formatModelsForSidebar = (models) => {
  return models.map(model => {
    // Extract a human-readable title from the model ID
    const title = formatModelTitle(model.id);
   
    // Create a description based on the owner and model name
    const description = `${model.owned_by} ${title}`;
   
    return {
      type: 'llm',
      icon: '🧠',
      title: title,
      description: description,
      data: {
        label: title,
        model: model.id,
        status: 'Ready',
        contextWindow: model.context_window,
        maxTokens: model.max_completion_tokens,
        ownedBy: model.owned_by,
        created: model.created
      }
    };
  });
};
 
/**
 * Format model ID into a human-readable title
 * @param {string} modelId - Raw model ID from API
 * @returns {string} Formatted title
 */
const formatModelTitle = (modelId) => {
  // Remove common prefixes
  let title = modelId
    .replace(/^meta-llama\//, '')
    .replace(/^openai\//, '')
    .replace(/^groq\//, '')
    .replace(/^moonshotai\//, '')
    .replace(/^qwen\//, '');
 
  // Convert to title case and clean up
  title = title
    .split(/[-_]/)
    .map(word => {
      // Handle special cases
      if (word.toLowerCase() === 'llama') return 'Llama';
      if (word.toLowerCase() === 'gpt') return 'GPT';
      if (word.toLowerCase() === 'oss') return 'OSS';
      if (word.toLowerCase() === 'it') return 'IT';
      if (/^\d+[a-z]*$/.test(word)) return word.toUpperCase(); // Numbers with letters
      if (/^\d+$/.test(word)) return word; // Pure numbers
     
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
 
  return title;
};
 
/**
 * Fallback models in case API is unavailable
 * @returns {Array} Default language models
 */
const getFallbackModels = () => {
  return [
    {
      type: 'llm',
      icon: '🧠',
      title: 'Llama 3.3 70B',
      description: 'Meta Llama 3.3 70B Versatile',
      data: {
        label: 'Llama 3.3 70B',
        model: 'llama-3.3-70b-versatile',
        status: 'Ready',
        contextWindow: 131072,
        maxTokens: 32768
      }
    },
    {
      type: 'llm',
      icon: '🧠',
      title: 'Llama 3.1 8B',
      description: 'Meta Llama 3.1 8B Instant',
      data: {
        label: 'Llama 3.1 8B',
        model: 'llama-3.1-8b-instant',
        status: 'Ready',
        contextWindow: 131072,
        maxTokens: 131072
      }
    },
    {
      type: 'llm',
      icon: '🧠',
      title: 'Gemma2 9B',
      description: 'Google Gemma2 9B Instruct',
      data: {
        label: 'Gemma2 9B',
        model: 'gemma2-9b-it',
        status: 'Ready',
        contextWindow: 8192,
        maxTokens: 8192
      }
    }
  ];
};
 
/**
 * Get formatted language models for the sidebar
 * This is the main function to be called by components
 * @returns {Promise<Array>} Formatted models ready for sidebar use
 */
export const getLanguageModels = async () => {
  try {
    const rawModels = await fetchGroqModels();
    const filteredModels = filterLanguageModels(rawModels);
    return formatModelsForSidebar(filteredModels);
  } catch (error) {
    console.error('Error getting language models:', error);
    return getFallbackModels();
  }
};

/**
 * Send a chat completion request to Groq API
 */
export const sendGroqChatCompletion = async (
  prompt,
  model = 'mixtral-8x7b-32768',
  maxTokens = 1024,
  temperature = 0.7
) => {
  try {
    const response = await fetch(`${GROQ_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending Groq chat completion:', error);
    throw error;
  }
};

export const isGroqApiKeyConfigured = () => {
  return Boolean(GROQ_API_KEY && GROQ_API_KEY.length > 0);
};

/**
 * Call the agent API endpoint
 * @param {Object} params - Parameters for the agent call
 * @param {string} params.userInput - The user's query/input
 * @param {string} params.apiKey - API key for the agent service
 * @param {string} params.agent - Agent type (e.g., "groq")
 * @param {number} params.temperature - Temperature for the model (0.0-1.0)
 * @param {string} params.modelName - Name of the model to use
 * @param {Array<string>} params.tools - Array of connected tool labels
 * @returns {Promise<Object>} Agent response
 */
export const callAgentAPI = async ({ userInput, apiKey, agent = "groq", temperature = 0.2, modelName = "groq/compound", tools = [] }) => {
  try {
    const response = await fetch('http://localhost:3000/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        userInput,
        agent,
        temperature,
        modelName,
        tools
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling agent API:', error);
    throw error;
  }
};

const groqService = {
  fetchGroqModels,
  sendGroqChatCompletion,
  isGroqApiKeyConfigured,
  filterLanguageModels,
  formatModelsForSidebar,
  getLanguageModels,
  callAgentAPI,
};

export default groqService;
