import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { initializeGroq } from "../LLM/groqAgent.js";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { MemorySaver } from "@langchain/langgraph";
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
        args: ["-y", "@azure-devops/mcp", "${input:ado_org}"],
      },
      postgres: {
        transport: "stdio",
        command: "npx",
        args: [
          "-y",
          "@modelcontextprotocol/server-postgres@0.6.2",
          "postgresql://csinshpl:LbI57kyTEDI5e4rOYTeu54@kyc-protect-rds-cluster-test.cluster-c75tta7e5wmw.eu-west-1.rds.amazonaws.com/kyc_protect_api_test"
        ],
      },
      awslabsCloudWatch: {
        transport: "stdio",
        command: "uvx",
        args: ["awslabs.cloudwatch-mcp-server@latest"],
        env: {
          AWS_PROFILE: process.env.AWS_PROFILE || "default",
          FASTMCP_LOG_LEVEL: "ERROR",
        },
      },
    },
    inputs: [
      {
        id: "ado_org",
        type: "promptString",
        description: "Azure DevOps organization name (e.g. 'contoso')",
      },
      {
        id: "pg_connection",
        type: "promptString",
        description: "Postgres connection string",
      },
    ],
  });
  const memorySaver = new MemorySaver();


  // Load all MCP tools
  const tools = await client.getTools();
  console.log("Loaded MCP tools:", tools.map(t => t.name));

  // Initialize Groq LLM
  const groqModel = await initializeGroq("openai/gpt-oss-20b");

  // Create React Agent
  const agent = createReactAgent({
    llm: groqModel, tools, memory: memorySaver,
    enableStepTracing: true
  });

  // User query
  const userQuery = "Check are there any profiles created recently";

  // Wrap input as HumanMessage
  const inputMsg = new HumanMessage({ text: userQuery });

  // Let the agent plan and call tools automatically
  const agentResponse = await agent.react(inputMsg);

  // The agent now decides which tools to call (CloudWatch, Postgres, etc.)
  console.log("Agent final output:", agentResponse.output);

  await client.close();
  return agentResponse.output;
}

// Run the fully agentic workflow
runAgent().catch(console.error);
