import { ChatGroq } from "@langchain/groq";

let groqModel = null;

export const initializeGroq = async (modelName) => {
  if (!groqModel) {
    groqModel = new ChatGroq({
      apiKey: process.env.REACT_APP_GROQ_API_KEY,
      model: modelName,
      temperature: 0.7
    });
  }
  return groqModel;
};

export const callGroq = async (messages) => {
  if (!groqModel) throw new Error("Groq model not initialized");
  return await groqModel.invoke(messages);
};
