import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";

// Read Supabase environment configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://gjduzipwtybvzvgefrza.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZHV6aXB3dHlidnp2Z2VmcnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjI5NTYsImV4cCI6MjEwMDc5ODk1Nn0.Gwf4ZGAfOfS-5JNaqFlqeGq1f4jbdctwSU98M70uHIw";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[Task Buddy MCP] Error: SUPABASE_URL and SUPABASE_ANON_KEY are required.");
  process.exit(1);
}

// Create Supabase client using Anon key
// If a user JWT token is passed in process.env.TASK_BUDDY_USER_TOKEN, we scope to that user
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
  global: process.env.TASK_BUDDY_USER_TOKEN ? {
    headers: {
      Authorization: `Bearer ${process.env.TASK_BUDDY_USER_TOKEN}`
    }
  } : undefined
});

const server = new Server(
  {
    name: "task-buddy-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tool schemas
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_lists",
        description: "Fetch all todo lists in Task Buddy",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "create_list",
        description: "Create a new list for grouping tasks",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Name of the list (e.g. Work, Personal, Shopping)" },
            description: { type: "string", description: "Optional description of the list" },
            color: { type: "string", description: "Hex color code or theme color (default: #6C63FF)" },
            deadline: { type: "string", description: "Optional list deadline (ISO format)" },
          },
          required: ["title"],
        },
      },
      {
        name: "list_tasks",
        description: "Fetch tasks with optional filtering by list, status, or priority",
        inputSchema: {
          type: "object",
          properties: {
            list_id: { type: "string", description: "Filter tasks by specific list ID" },
            is_completed: { type: "boolean", description: "Filter by completed (true) or pending (false) tasks" },
            priority: { type: "string", enum: ["low", "medium", "high"], description: "Filter by priority level" },
          },
        },
      },
      {
        name: "create_task",
        description: "Add a new task to Task Buddy",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Task title" },
            description: { type: "string", description: "Optional detailed description or notes" },
            list_id: { type: "string", description: "ID of the list this task belongs to. Optional." },
            priority: { type: "string", enum: ["low", "medium", "high"], description: "Priority level (default: medium)" },
            due_date: { type: "string", description: "Due date/time in ISO format (e.g., 2026-07-30T17:00:00Z)" },
          },
          required: ["title"],
        },
      },
      {
        name: "update_task",
        description: "Update an existing task by its ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID of the task to update" },
            title: { type: "string", description: "Updated title" },
            description: { type: "string", description: "Updated description" },
            priority: { type: "string", enum: ["low", "medium", "high"] },
            due_date: { type: "string", description: "Updated due date ISO string" },
            is_completed: { type: "boolean", description: "Mark completed status" },
          },
          required: ["id"],
        },
      },
      {
        name: "complete_task",
        description: "Mark a task as completed or uncompleted",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Task ID to complete" },
            is_completed: { type: "boolean", description: "true to complete, false to mark pending (default: true)" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_task",
        description: "Delete a task by its ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID of the task to delete" },
          },
          required: ["id"],
        },
      },
      {
        name: "search_tasks",
        description: "Search tasks by matching text in title or description",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search keyword" },
          },
          required: ["query"],
        },
      },
    ],
  };
});

// Tool handler execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const typedArgs = args as Record<string, any>;

  try {
    switch (name) {
      case "list_lists": {
        const { data, error } = await supabase.from("lists").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return {
          content: [{ type: "text", text: JSON.stringify(data || [], null, 2) }],
        };
      }

      case "create_list": {
        const payload = {
          title: typedArgs.title,
          description: typedArgs.description || null,
          color: typedArgs.color || "#6C63FF",
          deadline: typedArgs.deadline || null,
        };
        const { data, error } = await supabase.from("lists").insert([payload]).select();
        if (error) throw error;
        return {
          content: [{ type: "text", text: `List created successfully!\n${JSON.stringify(data[0], null, 2)}` }],
        };
      }

      case "list_tasks": {
        let query = supabase.from("tasks").select("*, lists(title, color)").order("created_at", { ascending: false });
        if (typedArgs.list_id) query = query.eq("list_id", typedArgs.list_id);
        if (typedArgs.is_completed !== undefined) query = query.eq("is_completed", typedArgs.is_completed);
        if (typedArgs.priority) query = query.eq("priority", typedArgs.priority);

        const { data, error } = await query;
        if (error) throw error;
        return {
          content: [{ type: "text", text: JSON.stringify(data || [], null, 2) }],
        };
      }

      case "create_task": {
        const payload = {
          title: typedArgs.title,
          description: typedArgs.description || null,
          list_id: typedArgs.list_id || null,
          priority: typedArgs.priority || "medium",
          due_date: typedArgs.due_date || null,
          is_completed: false,
          position: 0,
        };
        const { data, error } = await supabase.from("tasks").insert([payload]).select();
        if (error) throw error;
        return {
          content: [{ type: "text", text: `Task created successfully!\n${JSON.stringify(data[0], null, 2)}` }],
        };
      }

      case "update_task": {
        const { id, ...updates } = typedArgs;
        const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).select();
        if (error) throw error;
        return {
          content: [{ type: "text", text: `Task updated successfully!\n${JSON.stringify(data[0], null, 2)}` }],
        };
      }

      case "complete_task": {
        const isCompleted = typedArgs.is_completed !== undefined ? typedArgs.is_completed : true;
        const { data, error } = await supabase.from("tasks").update({ is_completed: isCompleted }).eq("id", typedArgs.id).select();
        if (error) throw error;
        return {
          content: [{ type: "text", text: `Task marked as ${isCompleted ? "completed" : "pending"}.\n${JSON.stringify(data[0], null, 2)}` }],
        };
      }

      case "delete_task": {
        const { error } = await supabase.from("tasks").delete().eq("id", typedArgs.id);
        if (error) throw error;
        return {
          content: [{ type: "text", text: `Task ID ${typedArgs.id} deleted successfully.` }],
        };
      }

      case "search_tasks": {
        const q = typedArgs.query;
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return {
          content: [{ type: "text", text: JSON.stringify(data || [], null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err: any) {
    return {
      content: [{ type: "text", text: `Error executing ${name}: ${err.message || String(err)}` }],
      isError: true,
    };
  }
});

// Start MCP Server on stdio
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[Task Buddy MCP Server] Running on stdio protocol");
}

main().catch((err) => {
  console.error("[Task Buddy MCP Server] Fatal error:", err);
  process.exit(1);
});
