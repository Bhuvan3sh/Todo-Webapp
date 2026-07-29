import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bot,
  Copy,
  Check,
  X,
  Code,
  Sparkles,
  Zap,
  Terminal,
  FileCode,
  Layers,
  Wand2,
} from 'lucide-react';

export const McpDocsModal: React.FC = () => {
  const { isMcpDocsOpen, setIsMcpDocsOpen, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'claude' | 'chatgpt' | 'cursor' | 'stdio'>('claude');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  if (!isMcpDocsOpen) return null;

  const mcpUrl = 'https://todo.theorave.in/api/mcp';
  const openApiUrl = 'https://todo.theorave.in/openapi.json';

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    showToast(`Copied ${label} to clipboard!`, 'success');
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        'task-buddy': {
          command: 'npx',
          args: ['-y', 'mcp-remote', mcpUrl],
        },
      },
    },
    null,
    2
  );

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        'task-buddy': {
          url: mcpUrl,
        },
      },
    },
    null,
    2
  );

  const stdioConfig = JSON.stringify(
    {
      mcpServers: {
        'task-buddy': {
          command: 'npx',
          args: ['-y', 'tsx', 'F:/Projects/To do Website/mcp-server/index.ts'],
        },
      },
    },
    null,
    2
  );

  const tools = [
    { name: 'list_lists', desc: 'Fetch all todo lists and deadline info' },
    { name: 'create_list', desc: 'Create a new list for organizing tasks' },
    { name: 'list_tasks', desc: 'Query tasks with filters (list, status, priority)' },
    { name: 'create_task', desc: 'Create a task with title, priority, due date, description' },
    { name: 'update_task', desc: 'Edit task title, priority, due date, or status' },
    { name: 'complete_task', desc: 'Quick toggle to complete or uncomplete a task' },
    { name: 'delete_task', desc: 'Delete a task by ID' },
    { name: 'search_tasks', desc: 'Search tasks by keywords in title/description' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl neu-raised rounded-neu-card p-5 sm:p-7 shadow-2xl relative transition-all max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-300/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full neu-raised flex items-center justify-center text-[#6C63FF]">
              <Bot className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                Connect AI Agent / MCP Server
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF]">
                  Model Context Protocol
                </span>
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Manage Task Buddy using natural language from Claude, ChatGPT, Cursor, and more.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMcpDocsOpen(false)}
            className="w-8 h-8 rounded-full neu-raised neu-button flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Core Endpoints Section */}
        <div className="mt-5 space-y-3">
          <div className="neu-sunken p-3.5 rounded-neu-card flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                Remote MCP Server URL
              </span>
              <p className="text-xs sm:text-sm font-mono text-[#6C63FF] font-semibold break-all">
                {mcpUrl}
              </p>
            </div>
            <button
              onClick={() => handleCopy(mcpUrl, 'MCP URL')}
              className="neu-raised neu-button px-3 py-1.5 rounded-neu-btn text-xs font-semibold text-gray-700 flex items-center gap-1.5 self-start sm:self-auto hover:text-[#6C63FF]"
            >
              {copiedItem === 'MCP URL' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[#6C63FF]" />}
              <span>{copiedItem === 'MCP URL' ? 'Copied!' : 'Copy MCP URL'}</span>
            </button>
          </div>

          <div className="neu-sunken p-3.5 rounded-neu-card flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                OpenAPI Spec (for Custom GPTs)
              </span>
              <p className="text-xs sm:text-sm font-mono text-indigo-600 font-semibold break-all">
                {openApiUrl}
              </p>
            </div>
            <button
              onClick={() => handleCopy(openApiUrl, 'OpenAPI URL')}
              className="neu-raised neu-button px-3 py-1.5 rounded-neu-btn text-xs font-semibold text-gray-700 flex items-center gap-1.5 self-start sm:self-auto hover:text-indigo-600"
            >
              {copiedItem === 'OpenAPI URL' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-indigo-600" />}
              <span>{copiedItem === 'OpenAPI URL' ? 'Copied!' : 'Copy Spec URL'}</span>
            </button>
          </div>
        </div>

        {/* Integration Guides Tabs */}
        <div className="mt-6">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
            Step-by-Step Setup Guides
          </h4>

          <div className="flex flex-wrap gap-2 border-b border-gray-300/30 pb-2 mb-4">
            <button
              onClick={() => setActiveTab('claude')}
              className={`px-3 py-1.5 rounded-neu-btn text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'claude' ? 'neu-pressed text-[#6C63FF]' : 'neu-raised text-gray-600 hover:text-gray-800'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-[#6C63FF]" /> Claude.ai & Desktop
            </button>

            <button
              onClick={() => setActiveTab('chatgpt')}
              className={`px-3 py-1.5 rounded-neu-btn text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'chatgpt' ? 'neu-pressed text-emerald-600' : 'neu-raised text-gray-600 hover:text-gray-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> ChatGPT
            </button>

            <button
              onClick={() => setActiveTab('cursor')}
              className={`px-3 py-1.5 rounded-neu-btn text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'cursor' ? 'neu-pressed text-indigo-600' : 'neu-raised text-gray-600 hover:text-gray-800'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-indigo-500" /> Cursor / Windsurf
            </button>

            <button
              onClick={() => setActiveTab('stdio')}
              className={`px-3 py-1.5 rounded-neu-btn text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'stdio' ? 'neu-pressed text-amber-600' : 'neu-raised text-gray-600 hover:text-gray-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-amber-500" /> Local Stdio
            </button>
          </div>

          {/* Tab Content Panels */}
          {activeTab === 'claude' && (
            <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
              <div className="neu-sunken p-4 rounded-neu-card space-y-2">
                <h5 className="font-bold text-gray-800 flex items-center gap-1.5 text-sm">
                  1. Claude.ai (Web App)
                </h5>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Go to <a href="https://claude.ai" target="_blank" rel="noreferrer" className="text-[#6C63FF] underline font-semibold">claude.ai</a> → <strong>Settings</strong> → <strong>Integrations / MCP</strong>.</li>
                  <li>Click <strong>Add MCP Server</strong>.</li>
                  <li>Paste the URL: <code className="bg-gray-200 px-1.5 py-0.5 rounded font-mono text-gray-800">{mcpUrl}</code></li>
                  <li>Claude will automatically detect all 8 Task Buddy actions!</li>
                </ol>
              </div>

              <div className="neu-sunken p-4 rounded-neu-card space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-gray-800 text-sm">
                    2. Claude Desktop Config (<code className="font-mono text-xs text-gray-600">claude_desktop_config.json</code>)
                  </h5>
                  <button
                    onClick={() => handleCopy(claudeDesktopConfig, 'Claude Desktop Config')}
                    className="text-[11px] font-bold text-[#6C63FF] hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy JSON
                  </button>
                </div>
                <pre className="p-3 bg-gray-900 text-emerald-400 rounded-neu-btn font-mono text-[11px] overflow-x-auto">
                  {claudeDesktopConfig}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'chatgpt' && (
            <div className="neu-sunken p-4 rounded-neu-card space-y-3 text-xs text-gray-700">
              <h5 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                Connect Task Buddy to ChatGPT (New Plugin / Custom Tool)
              </h5>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Go to <a href="https://chatgpt.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-semibold">ChatGPT</a> → <strong>Settings</strong> → <strong>Developer Tools</strong> → <strong>New Plugin</strong>.</li>
                <li>Set <strong>Name</strong>: <code className="bg-gray-200 px-1.5 py-0.5 rounded font-mono text-gray-800">Task Buddy</code></li>
                <li>Under <strong>Connection</strong>, select <strong>Server URL</strong> and enter:
                  <div className="my-1.5 font-mono text-xs text-emerald-700 bg-emerald-500/10 p-2 rounded border border-emerald-500/20 break-all flex items-center justify-between">
                    <span>{mcpUrl}</span>
                    <button
                      onClick={() => handleCopy(mcpUrl, 'Server URL')}
                      className="ml-2 px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700"
                    >
                      Copy URL
                    </button>
                  </div>
                </li>
                <li>Under <strong>Authentication</strong>, select <strong>OAuth</strong> (ChatGPT auto-discovers Task Buddy's RFC 8414 & RFC 9728 endpoints) or <strong>None</strong> for unauthenticated access.</li>
                <li>Check <em>"I understand and want to continue"</em> and click <strong>Create</strong>.</li>
              </ol>
              <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-300/30 space-y-1">
                <p>⚡ <strong>OAuth Discovery Endpoint:</strong> <code className="font-mono text-gray-700">https://todo.theorave.in/.well-known/oauth-protected-resource</code></p>
                <p>💡 <em>Alternative for Custom GPT Actions: Import OpenAPI spec URL <code className="font-mono text-gray-700">{openApiUrl}</code> in GPT Builder.</em></p>
              </div>
            </div>
          )}

          {activeTab === 'cursor' && (
            <div className="neu-sunken p-4 rounded-neu-card space-y-3 text-xs text-gray-700">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-gray-800 text-sm">
                  Cursor / Windsurf MCP Configuration
                </h5>
                <button
                  onClick={() => handleCopy(cursorConfig, 'Cursor Config')}
                  className="text-[11px] font-bold text-[#6C63FF] hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy JSON
                </button>
              </div>
              <p className="text-gray-600">
                Add this to your IDE's MCP settings (<code className="font-mono text-xs">.cursor/mcp.json</code> or global MCP settings):
              </p>
              <pre className="p-3 bg-gray-900 text-emerald-400 rounded-neu-btn font-mono text-[11px] overflow-x-auto">
                {cursorConfig}
              </pre>
            </div>
          )}

          {activeTab === 'stdio' && (
            <div className="neu-sunken p-4 rounded-neu-card space-y-3 text-xs text-gray-700">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-gray-800 text-sm">
                  Local Stdio Mode (Offline / Local Development)
                </h5>
                <button
                  onClick={() => handleCopy(stdioConfig, 'Stdio Config')}
                  className="text-[11px] font-bold text-[#6C63FF] hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy JSON
                </button>
              </div>
              <pre className="p-3 bg-gray-900 text-amber-400 rounded-neu-btn font-mono text-[11px] overflow-x-auto">
                {stdioConfig}
              </pre>
            </div>
          )}
        </div>

        {/* 8 MCP Tools Grid */}
        <div className="mt-6">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#6C63FF]" />
            8 Available MCP Tools
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {tools.map((tool) => (
              <div key={tool.name} className="neu-sunken p-2.5 rounded-neu-btn flex items-start space-x-2">
                <code className="text-[11px] font-mono font-bold text-[#6C63FF] bg-[#6C63FF]/10 px-1.5 py-0.5 rounded flex-shrink-0">
                  {tool.name}
                </code>
                <span className="text-[11px] text-gray-600 line-clamp-2">
                  {tool.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt Examples */}
        <div className="mt-6 p-4 rounded-neu-card bg-[#6C63FF]/5 border border-[#6C63FF]/20 text-xs text-gray-700">
          <h5 className="font-bold text-gray-800 flex items-center gap-1.5 mb-1.5">
            <Wand2 className="w-4 h-4 text-[#6C63FF]" /> Example Natural Language Prompts
          </h5>
          <ul className="space-y-1 text-gray-600 list-disc list-inside">
            <li><em>"Show me all tasks due today in my Launch list"</em></li>
            <li><em>"Add a high priority task 'Review pull request' due tomorrow at 4 PM"</em></li>
            <li><em>"Mark the task 'Buy groceries' as completed"</em></li>
          </ul>
        </div>

      </div>
    </div>
  );
};
