import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { IncomingMessage, ServerResponse } from "http";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://gjduzipwtybvzvgefrza.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

function getSupabase(userToken?: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: userToken
      ? { headers: { Authorization: `Bearer ${userToken}` } }
      : undefined,
  });
}

function createTaskBuddyServer(userToken?: string): McpServer {
  const server = new McpServer({
    name: "task-buddy-mcp",
    version: "1.0.0",
  });

  // ─── LIST LISTS ──────────────────────────────────────────
  server.tool("list_lists", "Fetch all todo lists in Task Buddy", {}, async () => {
    const supabase = getSupabase(userToken);
    const { data, error } = await supabase
      .from("lists")
      .select("id, title, description, color, deadline, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { content: [{ type: "text" as const, text: JSON.stringify(data || [], null, 2) }] };
  });

  // ─── CREATE LIST ─────────────────────────────────────────
  server.tool(
    "create_list",
    "Create a new list for grouping tasks",
    {
      title: z.string().describe("Name of the list (e.g. Work, Personal, Shopping)"),
      description: z.string().optional().describe("Optional description"),
      color: z.string().optional().describe("Hex color code (default: #6C63FF)"),
      deadline: z.string().optional().describe("Optional deadline in ISO format"),
    },
    async ({ title, description, color, deadline }) => {
      const supabase = getSupabase(userToken);
      const { data, error } = await supabase
        .from("lists")
        .insert([{ title, description: description || null, color: color || "#6C63FF", deadline: deadline || null }])
        .select();
      if (error) throw new Error(error.message);
      return { content: [{ type: "text" as const, text: `List created!\n${JSON.stringify(data[0], null, 2)}` }] };
    }
  );

  // ─── LIST TASKS ──────────────────────────────────────────
  server.tool(
    "list_tasks",
    "Fetch tasks with optional filtering by list, status, or priority",
    {
      list_id: z.string().optional().describe("Filter by list ID"),
      is_completed: z.boolean().optional().describe("Filter by completed (true) or pending (false)"),
      priority: z.enum(["low", "medium", "high"]).optional().describe("Filter by priority level"),
    },
    async ({ list_id, is_completed, priority }) => {
      const supabase = getSupabase(userToken);
      let query = supabase
        .from("tasks")
        .select("id, title, description, is_completed, priority, due_date, position, created_at, list_id, lists(title, color)")
        .order("created_at", { ascending: false });
      if (list_id) query = query.eq("list_id", list_id);
      if (is_completed !== undefined) query = query.eq("is_completed", is_completed);
      if (priority) query = query.eq("priority", priority);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return { content: [{ type: "text" as const, text: JSON.stringify(data || [], null, 2) }] };
    }
  );

  // ─── CREATE TASK ─────────────────────────────────────────
  server.tool(
    "create_task",
    "Add a new task to Task Buddy",
    {
      title: z.string().describe("Task title"),
      description: z.string().optional().describe("Detailed description or notes"),
      list_id: z.string().optional().describe("ID of the list this task belongs to"),
      priority: z.enum(["low", "medium", "high"]).optional().describe("Priority level (default: medium)"),
      due_date: z.string().optional().describe("Due date/time in ISO format (e.g. 2026-07-30T17:00:00Z)"),
    },
    async ({ title, description, list_id, priority, due_date }) => {
      const supabase = getSupabase(userToken);
      const { data, error } = await supabase
        .from("tasks")
        .insert([{ title, description: description || null, list_id: list_id || null, priority: priority || "medium", due_date: due_date || null, is_completed: false, position: 0 }])
        .select();
      if (error) throw new Error(error.message);
      return { content: [{ type: "text" as const, text: `Task created!\n${JSON.stringify(data[0], null, 2)}` }] };
    }
  );

  // ─── UPDATE TASK ─────────────────────────────────────────
  server.tool(
    "update_task",
    "Update an existing task by its ID",
    {
      id: z.string().describe("ID of the task to update"),
      title: z.string().optional().describe("Updated title"),
      description: z.string().optional().describe("Updated description"),
      priority: z.enum(["low", "medium", "high"]).optional().describe("Updated priority"),
      due_date: z.string().optional().describe("Updated due date ISO string"),
      is_completed: z.boolean().optional().describe("Mark completed status"),
    },
    async ({ id, title, description, priority, due_date, is_completed }) => {
      const supabase = getSupabase(userToken);
      const updates: Record<string, any> = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (priority !== undefined) updates.priority = priority;
      if (due_date !== undefined) updates.due_date = due_date;
      if (is_completed !== undefined) updates.is_completed = is_completed;
      const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).select();
      if (error) throw new Error(error.message);
      return { content: [{ type: "text" as const, text: `Task updated!\n${JSON.stringify(data[0], null, 2)}` }] };
    }
  );

  // ─── COMPLETE TASK ───────────────────────────────────────
  server.tool(
    "complete_task",
    "Mark a task as completed or uncompleted",
    {
      id: z.string().describe("Task ID to complete"),
      is_completed: z.boolean().optional().describe("true to complete, false to mark pending (default: true)"),
    },
    async ({ id, is_completed }) => {
      const supabase = getSupabase(userToken);
      const completed = is_completed !== undefined ? is_completed : true;
      const { data, error } = await supabase.from("tasks").update({ is_completed: completed }).eq("id", id).select();
      if (error) throw new Error(error.message);
      return { content: [{ type: "text" as const, text: `Task marked as ${completed ? "completed ✅" : "pending ⏳"}.\n${JSON.stringify(data[0], null, 2)}` }] };
    }
  );

  // ─── DELETE TASK ─────────────────────────────────────────
  server.tool(
    "delete_task",
    "Delete a task by its ID",
    { id: z.string().describe("ID of the task to delete") },
    async ({ id }) => {
      const supabase = getSupabase(userToken);
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return { content: [{ type: "text" as const, text: `Task ${id} deleted successfully.` }] };
    }
  );

  // ─── SEARCH TASKS ────────────────────────────────────────
  server.tool(
    "search_tasks",
    "Search tasks by matching text in title or description",
    { query: z.string().describe("Search keyword") },
    async ({ query }) => {
      const supabase = getSupabase(userToken);
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, description, is_completed, priority, due_date, created_at")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return { content: [{ type: "text" as const, text: JSON.stringify(data || [], null, 2) }] };
    }
  );

  return server;
}

// ─── Vercel Serverless Function Handler ────────────────────
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Mcp-Session-Id");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Extract user's Bearer token (set by Claude.ai after OAuth login)
  const authHeader = req.headers.authorization || "";
  const userToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        name: "task-buddy-mcp",
        version: "1.0.0",
        description: "Task Buddy MCP Server — manage tasks and todo lists via any AI agent",
        protocol: "MCP (Model Context Protocol)",
        transport: "Streamable HTTP",
        endpoint: "https://todo.theorave.in/api/mcp",
        authenticated: !!userToken,
        tools: [
          "list_lists", "create_list", "list_tasks", "create_task",
          "update_task", "complete_task", "delete_task", "search_tasks",
        ],
      })
    );
    return;
  }

  if (req.method === "POST") {
    try {
      const mcpServer = createTaskBuddyServer(userToken);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res);
    } catch (err: any) {
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message || "Internal Server Error" }));
      }
    }
    return;
  }

  if (req.method === "DELETE") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(405, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Method not allowed" }));
}
