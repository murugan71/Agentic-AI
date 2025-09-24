import { ChatGroq } from "@langchain/groq";

let groqModel = null;

const initializeGroq = async (modelName = null) => {
  try {
    const groq = new ChatGroq({
      apiKey: process.env.REACT_APP_GROQ_API_KEY,
      model: modelName,
      temperature: 0.7
    });

    return groq;
  } catch (err) {
    throw err;
  }
};

const initializellm = async (modelName = null) => {
  try {
    console.log("🔑 API Key exists:", !!process.env.REACT_APP_GROQ_API_KEY);
    console.log("🤖 Model:", modelName || process.env.REACT_APP_GROQ_MODEL);

    // Initialize Groq with specified model or default
    groqModel = await initializeGroq(modelName);

    console.log("✓ Groq initialized successfully with model:", modelName || process.env.REACT_APP_GROQ_MODEL);
    return groqModel;
  } catch (err) {
    console.error("Agent error:", err);
    throw err;
  }
};

const getGroqModel = () => {
  return groqModel;
};

// Function to process messages through the LLM
const processMessage = async (message, systemPrompt = null) => {
  try {
    if (!groqModel) {
      throw new Error("LLM model not initialized. Call initializeAgent first.");
    }

    const messages = [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt
      });
    }
    
    // Add user message
    messages.push({
      role: "user", 
      content: message
    });

    console.log("🤖 Processing message with LLM:", message);
    
    const response = await groqModel.invoke(messages);
    
    console.log("✓ LLM response received:", response.content);
    
    return {
      success: true,
      response: response.content,
      timestamp: new Date()
    };
  } catch (error) {
    console.error("❌ LLM processing error:", error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

export { initializellm, getGroqModel, processMessage };
