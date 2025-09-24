import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { initializeGroq, callGroq } from "../LLM/groqAgent.js";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import 'dotenv/config'


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
        // "awslabs.cloudwatch-mcp-server": {
        //   transport: "stdio",
        //   command: "uvx",
        //   args: ["awslabs.cloudwatch-mcp-server@latest"],
        //   env: {
        //     AWS_PROFILE: "[The AWS Profile Name to use for AWS access]",
        //     FASTMCP_LOG_LEVEL: "ERROR",
        //   },
        // },
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
            description: "Postgres connection string (e.g. 'postgres://user:pass@host:5432/db')",
        },
    ],
});

const tools = await client.getTools();
console.log("Loaded MCP tools:", tools.map((t) => t.name));
const groqModel = await initializeGroq("llama-3.1-8b-instant");
const agent = createReactAgent({
  llm: groqModel,
  tools,
});
