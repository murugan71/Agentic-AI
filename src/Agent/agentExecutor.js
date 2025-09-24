import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { initializeGroq } from "../LLM/groqAgent.js";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import 'dotenv/config';

async function runAgent() {
  const client = new MultiServerMCPClient({
    throwOnLoadError: true,
    prefixToolNameWithServerName: false,
    additionalToolNamePrefix: "",
    useStandardContentBlocks: true,
    mcpServers: {
      context7: {
        transport: "stdio",
        command: "npx",
        args: ["-y", "@upstash/context7-mcp"],
      },
      ado: {
        transport: "stdio",
        command: "npx",
        args: ["-y", "@azure-devops/mcp", "creditsafe"],
        env: {
          NODE_TLS_REJECT_UNAUTHORIZED: "0", // Disable SSL certificate verification for this MCP server
        }
      },
      postgresql: {
        command: "npx",
        args: [
          "-y",
          "@executeautomation/database-server",
          "--postgresql",
          "--host", "localhost",
          "--database", "kyc_protect_api_development",
          "--user", "postgres",
          "--password", "elephant",
          "--port", "6432",
        ],
      },
    }
  });

  // Memory for tracking agent state
  const memorySaver = new MemorySaver();


  // Load all MCP tools
  const rawTools = await client.getTools();

  // Enhance tools with descriptions and example prompts
  const tools = rawTools.map(tool => {
    if (tool.name.toLowerCase().includes("ado") || tool.name.toLowerCase().includes("azure-devops")) {
      return Object.assign(tool, {
        description: "Use to fetch and summarize wiki pages and data from Azure DevOps projects. Input: specify project info, wiki URL, or work item details.",
        examplePrompt: "Fetch the learnings summary from the wiki page at https://dev.azure.com/creditsafe/Compliance/_wiki/wikis/Compliance.wiki/16752/Learnings"
      });
    }
    if (tool.name.toLowerCase().includes("postgresql") || tool.name.toLowerCase().includes("database")) {
      return Object.assign(tool, {
        description: "Query structured data in the PostgreSQL database 'kyc_protect_api_development'. Input can be SQL queries or natural language mapped to SQL.",
        examplePrompt: "Find recent error events from the last hour."
      });
    }
    return tool;
  });

  console.log("Loaded MCP tools:", tools.map(t => t.name));
  console.log("Total tools loaded:", tools.length);


  // Initialize Groq LLM
  const groqModel = await initializeGroq("whisper-large-v3");
  const agentModel = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
    streaming: false,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Create React Agent
  const agent = createReactAgent({
    llm: groqModel,
    tools,
    memory: memorySaver,
    enableStepTracing: true,
  });


  // Compose explicit instructions to guide the agent
  const userQueryRaw = "https://dev.azure.com/creditsafe/Compliance/_wiki/wikis/Compliance.wiki/13854/New-Starter-Access-Request-Details";

  const userQuery = `
    You are an AI assistant with access to these tools:

    - Azure DevOps MCP tool: use it to fetch and summarize wiki pages from dev.azure.com URLs.
    - PostgreSQL MCP tool: use it to execute SQL queries against the 'kyc_protect_api_development' database.

    Task: Based on the user input below, decide which tool(s) to call to provide a concise, relevant summary.

    User Input: ${userQueryRaw}
`.trim();


  const inputMsg = new HumanMessage({ content: userQuery });


  // Config with recursion/iteration limits and callbacks for verbose logging
  const config = {
    recursionLimit: 20,
    maxIterations: 10,
    configurable: { thread_id: "default-thread" },
    callbacks: [{
      handleLLMStart: (llm, prompts) => {
        console.log("🤖 LLM Call - Prompts:", prompts.length);
      },
      handleToolStart: (tool, input) => {
        console.log("🔧 Tool Call:", tool.name, "input:", JSON.stringify(input, null, 2));
      },
      handleToolEnd: (output) => {
        console.log("✅ Tool Result:", JSON.stringify(output, null, 2));
      },
      handleToolError: (err) => {
        console.log("❌ Tool Error:", err.message);
      }
    }]
  };


  // Run the agent now
  try {
    console.log("🚀 Starting agent execution...");
    console.log("📋 Config:", {
      recursionLimit: config.recursionLimit,
      maxIterations: config.maxIterations,
      thread_id: config.configurable.thread_id,
    });

    const agentResponse = await agent.invoke({
      messages: [inputMsg]
    }, config);

    console.log("✅ Agent completed successfully");
    console.log("📊 Total messages:", agentResponse.messages.length);

    agentResponse.messages.forEach((msg, idx) => {
      console.log(`Message ${idx + 1}:`, msg.constructor.name, msg.content.substring(0, 200) + "...");
    });

    const finalMessage = agentResponse.messages[agentResponse.messages.length - 1];
    console.log("🎯 Agent final output:", finalMessage.content);

    await client.close();
    return finalMessage.content;

  } catch (error) {
    console.error("Agent execution failed:", error);

    if (error.lc_error_code === 'GRAPH_RECURSION_LIMIT') {
      console.log("Recursion limit reached. Consider clearer stopping criteria or fewer tool calls.");
    }

    await client.close();
    throw error;
  }
}

runAgent().catch(console.error);