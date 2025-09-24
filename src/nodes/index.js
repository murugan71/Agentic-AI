import AgentNode from './AgentNode.js';
import LLMNode from './LLMNode.js';
import DatabaseNode from './DatabaseNode.js';
import GmailNode from './GmailNode.js';
import TeamsNode from './TeamsNode.js';
import ToolNode from './ToolNode.js';
import MemoryNode from './MemoryNode.js';
import ChatNode from './ChatNode.js';

export const nodeTypes = {
  agent: AgentNode,
  llm: LLMNode,
  database: DatabaseNode,
  gmail: GmailNode,
  teams: TeamsNode,
  tool: ToolNode,
  memory: MemoryNode,
  chat: ChatNode,
};

export { AgentNode, LLMNode, DatabaseNode, GmailNode, TeamsNode, ToolNode, MemoryNode, ChatNode };