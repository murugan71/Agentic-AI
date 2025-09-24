const GROQ_API_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_API_KEY = ''; // In production, use environment variables

/**
 * Fetch available models from Groq API
 * @returns {Promise<Array>} Array of model objects
 */
export const fetchGroqModels = async () => {
  try {
    const response = await fetch(${GROQ_API_BASE_URL}/models, {
      method: 'GET',
      headers: {
        'Authorization': Bearer ,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(HTTP error! status: );
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Groq models:', error);
    throw error;
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
    const response = await fetch(${GROQ_API_BASE_URL}/chat/completions, {
      method: 'POST',
      headers: {
        'Authorization': Bearer ,
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
      throw new Error(HTTP error! status: );
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

export default {
  fetchGroqModels,
  sendGroqChatCompletion,
  isGroqApiKeyConfigured,
};
