import React, { useState } from 'react';
import { Bot, Copy, Check, Sparkles, Code, Terminal, Zap, Wand2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const McpDocsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'claude' | 'chatgpt' | 'cursor' | 'stdio'>('claude');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const mcpUrl = 'https://todo.theorave.in/api/mcp';
  const openApiUrl = 'https://todo.theorave.in/openapi.json';

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
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
    <div className="min-h-screen bg-[#E0E5EC] py-8 px-4 sm:px-6 lg:px-8 text-gray-800">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-300/40">
          <Link
            to="/dashboard"
            className="neu-raised neu-button px-4 py-2 rounded-neu-btn text-xs font-bold text-gray-700 flex items-center gap-2 hover:text-[#6C63FF]"
          >
            <ArrowLeft className="w-4 h-4 text-[#6C63FF]" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full neu-raised flex items-center justify-center text-[#6C63FF]">
              <Bot className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-lg text-gray-800">Task Buddy</span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="neu-raised rounded-neu-card p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#6C63FF]/10 text-[#6C63FF]">
                  Claude MCP Priority Integration
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
                Connect AI
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Seamlessly connect Claude, ChatGPT, Cursor, and AI agents directly to your Task Buddy database via Model Context Protocol.
              </p>
            </div>
          </div>

          {/* Core Endpoints Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="neu-sunken p-4 rounded-neu-card flex flex-col justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  Remote MCP Server Endpoint
                </span>
                <p className="text-xs sm:text-sm font-mono text-[#6C63FF] font-semibold break-all mt-1">
                  {mcpUrl}
                </p>
              </div>
              <button
                onClick={() => handleCopy(mcpUrl, 'MCP URL')}
                className="neu-raised neu-button px-3 py-1.5 rounded-neu-btn text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 hover:text-[#6C63FF]"
              >
                {copiedItem === 'MCP URL' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[#6C63FF]" />}
                <span>{copiedItem === 'MCP URL' ? 'Copied URL!' : 'Copy Remote MCP URL'}</span>
              </button>
            </div>

            <div className="neu-sunken p-4 rounded-neu-card flex flex-col justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  OpenAPI Spec (Custom GPT / OpenAPI)
                </span>
                <p className="text-xs sm:text-sm font-mono text-indigo-600 font-semibold break-all mt-1">
                  {openApiUrl}
                </p>
              </div>
              <button
                onClick={() => handleCopy(openApiUrl, 'OpenAPI URL')}
                className="neu-raised neu-button px-3 py-1.5 rounded-neu-btn text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 hover:text-indigo-600"
              >
                {copiedItem === 'OpenAPI URL' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-indigo-600" />}
                <span>{copiedItem === 'OpenAPI URL' ? 'Copied Spec!' : 'Copy OpenAPI Spec'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs section */}
        <div className="neu-raised rounded-neu-card p-6 space-y-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Step-by-Step Setup Guides (Priority: Claude MCP)
          </h2>

          <div className="flex flex-wrap gap-2 border-b border-gray-300/30 pb-3">
            <button
              onClick={() => setActiveTab('claude')}
              className={`px-4 py-2 rounded-neu-btn text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'claude' ? 'neu-pressed text-[#6C63FF] border-b-2 border-[#6C63FF]' : 'neu-raised text-gray-600 hover:text-gray-800'
              }`}
            >
              <Bot className="w-4 h-4 text-[#6C63FF]" /> Claude MCP (Recommended)
            </button>

            <button
              onClick={() => setActiveTab('chatgpt')}
              className={`px-4 py-2 rounded-neu-btn text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'chatgpt' ? 'neu-pressed text-emerald-600' : 'neu-raised text-gray-600 hover:text-gray-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-500" /> ChatGPT Custom Tools
            </button>

            <button
              onClick={() => setActiveTab('cursor')}
              className={`px-4 py-2 rounded-neu-btn text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'cursor' ? 'neu-pressed text-indigo-600' : 'neu-raised text-gray-600 hover:text-gray-800'
              }`}
            >
              <Code className="w-4 h-4 text-indigo-500" /> Cursor / Windsurf
            </button>

            <button
              onClick={() => setActiveTab('stdio')}
              className={`px-4 py-2 rounded-neu-btn text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'stdio' ? 'neu-pressed text-amber-600' : 'neu-raised text-gray-600 hover:text-gray-800'
              }`}
            >
              <Terminal className="w-4 h-4 text-amber-500" /> Local Stdio
            </button>
          </div>

          {/* Active Tab Details */}
          {activeTab === 'claude' && (
            <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
              <div className="neu-sunken p-5 rounded-neu-card space-y-3">
                <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#6C63FF]" />
                  1. Claude.ai (Web App Integration)
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Open <a href="https://claude.ai" target="_blank" rel="noreferrer" className="text-[#6C63FF] underline font-bold">Claude.ai</a> and go to <strong>Settings</strong> → <strong>Integrations / MCP</strong>.</li>
                  <li>Click <strong>Add MCP Server</strong>.</li>
                  <li>Enter Server URL: <code className="bg-gray-200 px-2 py-0.5 rounded font-mono font-bold text-gray-800">{mcpUrl}</code></li>
                  <li>Claude automatically binds all 8 Task Buddy actions to your current task lists and todos!</li>
                </ol>
              </div>

              <div className="neu-sunken p-5 rounded-neu-card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-gray-800 text-sm">
                    2. Claude Desktop Integration (<code className="font-mono text-xs text-gray-600">claude_desktop_config.json</code>)
                  </h3>
                  <button
                    onClick={() => handleCopy(claudeDesktopConfig, 'Claude Desktop Config')}
                    className="neu-raised neu-button px-3 py-1 rounded-neu-btn text-[11px] font-bold text-[#6C63FF] flex items-center gap-1 hover:underline"
                  >
                    <Copy className="w-3 h-3" /> Copy Claude Config JSON
                  </button>
                </div>
                <pre className="p-4 bg-gray-900 text-emerald-400 rounded-neu-btn font-mono text-xs overflow-x-auto">
                  {claudeDesktopConfig}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'chatgpt' && (
            <div className="neu-sunken p-5 rounded-neu-card space-y-3 text-xs text-gray-700">
              <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
                Connect Task Buddy to ChatGPT
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Go to <a href="https://chatgpt.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-bold">ChatGPT</a> → <strong>Settings</strong> → <strong>Developer Tools</strong>.</li>
                <li>Set Plugin Name to <code className="bg-gray-200 px-2 py-0.5 rounded font-mono font-bold">Task Buddy</code></li>
                <li>Enter Server Endpoint: <code className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">{mcpUrl}</code></li>
                <li>Click <strong>Create Plugin</strong>.</li>
              </ol>
            </div>
          )}

          {activeTab === 'cursor' && (
            <div className="neu-sunken p-5 rounded-neu-card space-y-3 text-xs text-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-gray-800 text-sm">
                  Cursor & Windsurf IDE Setup
                </h3>
                <button
                  onClick={() => handleCopy(cursorConfig, 'Cursor Config')}
                  className="neu-raised neu-button px-3 py-1 rounded-neu-btn text-[11px] font-bold text-[#6C63FF] flex items-center gap-1 hover:underline"
                >
                  <Copy className="w-3 h-3" /> Copy Cursor JSON
                </button>
              </div>
              <pre className="p-4 bg-gray-900 text-emerald-400 rounded-neu-btn font-mono text-xs overflow-x-auto">
                {cursorConfig}
              </pre>
            </div>
          )}

          {activeTab === 'stdio' && (
            <div className="neu-sunken p-5 rounded-neu-card space-y-3 text-xs text-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-gray-800 text-sm">
                  Local Stdio Command Setup
                </h3>
                <button
                  onClick={() => handleCopy(stdioConfig, 'Stdio Config')}
                  className="neu-raised neu-button px-3 py-1 rounded-neu-btn text-[11px] font-bold text-[#6C63FF] flex items-center gap-1 hover:underline"
                >
                  <Copy className="w-3 h-3" /> Copy Stdio JSON
                </button>
              </div>
              <pre className="p-4 bg-gray-900 text-amber-400 rounded-neu-btn font-mono text-xs overflow-x-auto">
                {stdioConfig}
              </pre>
            </div>
          )}
        </div>

        {/* 8 MCP Tools Grid */}
        <div className="neu-raised rounded-neu-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#6C63FF]" />
            Supported Actions & Tools (8 Total)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tools.map((tool) => (
              <div key={tool.name} className="neu-sunken p-3 rounded-neu-btn flex items-start space-x-2.5">
                <code className="text-xs font-mono font-extrabold text-[#6C63FF] bg-[#6C63FF]/10 px-2 py-0.5 rounded flex-shrink-0">
                  {tool.name}
                </code>
                <span className="text-xs text-gray-600">
                  {tool.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt Examples */}
        <div className="neu-raised rounded-neu-card p-6 bg-[#6C63FF]/5 border border-[#6C63FF]/20 text-xs text-gray-700 space-y-2">
          <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-[#6C63FF]" /> Natural Language Command Examples
          </h3>
          <ul className="space-y-1.5 text-gray-600 list-disc list-inside">
            <li><em>"Create a high-priority task 'Deploy to mobile device' due today"</em></li>
            <li><em>"Show me all tasks in my Launch list"</em></li>
            <li><em>"Mark task 'Review neumorphic styling' as complete"</em></li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default McpDocsPage;
