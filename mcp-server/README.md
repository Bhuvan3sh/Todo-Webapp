# 🔌 Task Buddy Universal MCP Server

Connect **Task Buddy** to **any AI agent** — Claude.ai, ChatGPT, Cursor, Windsurf, Antigravity, or any MCP-compatible client — to manage your tasks and todo lists using natural language.

**🌐 Remote MCP Endpoint:** `https://todo.theorave.in/api/mcp`

---

## 🔒 Security & Privacy

- **User-Scoped Operations**: All operations respect Supabase Row Level Security (RLS).
- **No Secret Admin Keys**: No `SERVICE_ROLE_KEY` is exposed anywhere.
- **Sanitized Outputs**: Internal system tokens are stripped from tool results.

---

## 🌐 Connect from ANY AI Web App (Claude.ai, ChatGPT, etc.)

### Claude.ai (Web)
1. Go to [claude.ai](https://claude.ai) → **Settings** → **Integrations** (or **MCP Servers**).
2. Click **Add Integration** or **Add MCP Server**.
3. Enter the URL:
   ```
   https://todo.theorave.in/api/mcp
   ```
4. Done! Claude will discover all 8 Task Buddy tools automatically.

### ChatGPT (Plugin / Custom Tool)
1. Go to [ChatGPT](https://chatgpt.com) → **Settings** → **Developer Tools** → **New Plugin**.
2. Set **Name**: `Task Buddy`.
3. Under **Connection**, select **Server URL** and enter:
   ```
   https://todo.theorave.in/api/mcp
   ```
4. Select **Authentication** (OAuth or None), check *"I understand and want to continue"*, and click **Create**.
5. Done! ChatGPT connects directly to Task Buddy's MCP server.

*(Note: For Custom GPT Actions, you can also import `https://todo.theorave.in/openapi.json`)*

### Any MCP-Compatible Web Client
Just point it to:
```
https://todo.theorave.in/api/mcp
```

---

## 🖥️ Connect from Local Coding Agents

### Claude Desktop
Edit `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac):

```json
{
  "mcpServers": {
    "task-buddy": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://todo.theorave.in/api/mcp"]
    }
  }
}
```

### Cursor / Windsurf / VS Code (Antigravity)
Add to your MCP configuration (`mcp.json` or settings):

```json
{
  "mcpServers": {
    "task-buddy": {
      "url": "https://todo.theorave.in/api/mcp"
    }
  }
}
```

**Or run locally via stdio** (for offline use):
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

## 🧰 Available Tools (8 Actions)

| Tool | Description |
| :--- | :--- |
| `list_lists` | Fetch all todo lists |
| `create_list` | Create a new list for organizing tasks |
| `list_tasks` | Query tasks with filters (list, status, priority) |
| `create_task` | Create a task with title, priority, due date, description |
| `update_task` | Edit task title, priority, due date, or status |
| `complete_task` | Quick toggle to complete or uncomplete a task |
| `delete_task` | Delete a task by ID |
| `search_tasks` | Search tasks by keywords in title/description |

---

## 🧪 Example Prompts

- *"List all my pending tasks"*
- *"Add a high priority task 'Review PR #42' due tomorrow at 3 PM"*
- *"Mark the 'Buy groceries' task as completed"*
- *"Create a new list called 'Work Projects'"*
- *"Search for tasks related to 'meeting'"*
