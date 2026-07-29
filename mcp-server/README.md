# 🔌 Task Buddy MCP Server & Remote AI Integration

Connect **Task Buddy** (`https://todo.theorave.in`) to any coding agent (Claude Desktop, Antigravity, Cursor, Windsurf) or cloud LLM (ChatGPT) to manage your tasks and todo lists using natural language.

---

## 🔒 Security & Privacy Features

- **User-Scoped Operations**: Operations run under user identity and respect Supabase Row Level Security (RLS).
- **No Secret Admin Keys**: No `SERVICE_ROLE_KEY` is exposed in public or client bundles.
- **Sanitized Outputs**: System tokens and internal user state are stripped before sending tool results back to LLMs.

---

## 🛠️ Option 1: Connect to Local Coding Agents (Claude Desktop, Antigravity, Cursor, Windsurf)

You can run the MCP server locally over `stdio`.

### 1. Build the server
```bash
npm install
npm run mcp:build
```

### 2. Configuration snippets

#### A. Claude Desktop (`claude_desktop_config.json`)
Add this under `"mcpServers"`:
```json
{
  "mcpServers": {
    "task-buddy": {
      "command": "node",
      "args": ["F:/Projects/To do Website/dist-mcp/index.js"],
      "env": {
        "VITE_SUPABASE_URL": "https://gjduzipwtybvzvgefrza.supabase.co",
        "VITE_SUPABASE_ANON_KEY": "YOUR_SUPABASE_ANON_KEY"
      }
    }
  }
}
```

#### B. Antigravity / Cursor / Windsurf (`.vscode/mcp.json` or Global Config)
```json
{
  "mcpServers": {
    "task-buddy": {
      "command": "npx",
      "args": ["-y", "tsx", "F:/Projects/To do Website/mcp-server/index.ts"]
    }
  }
}
```

---

## 🌐 Option 2: Connect to ChatGPT (Custom GPT Actions)

To connect **ChatGPT** directly to your hosted app on **`https://todo.theorave.in`**:

1. Go to **ChatGPT** -> **Explore GPTs** -> **Create a GPT**.
2. Click on **Configure** -> **Create new action**.
3. Click **Import from URL** and paste:
   ```
   https://todo.theorave.in/openapi.json
   ```
4. Click **Import**. ChatGPT will auto-import all Task Buddy tools (`list_tasks`, `create_task`, `complete_task`, `delete_task`, `list_lists`).
5. (Optional Auth): Set **Authentication** -> **API Key / Bearer Token** with your Supabase JWT if you want task isolation.

---

## 🧪 Available Tools

| Tool Name | Description |
| :--- | :--- |
| `list_tasks` | Query pending or completed tasks |
| `create_task` | Add a new task (title, description, priority, due date, list) |
| `update_task` | Modify an existing task's title, description, priority, due date |
| `complete_task` | Quick toggle to complete or uncomplete a task |
| `delete_task` | Remove a task by ID |
| `list_lists` | Get all todo lists |
| `create_list` | Create a new list for organizing tasks |
| `search_tasks` | Search tasks by matching keywords |
