import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://gjduzipwtybvzvgefrza.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

// Helper: build a user-scoped Supabase client
function getSupabase(token?: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined,
  });
}

const handler = createMcpHandler(
  (server) => {
    // ─── LIST LISTS ──────────────────────────────────────────
    server.registerTool(
      "list_lists",
      {
        title: "List Lists",
        description: "Fetch all todo lists in Task Buddy",
        inputSchema: {},
      },
      async () => {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from("lists")
          .select("id, title, description, color, deadline, created_at")
          .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(data || [], null, 2) },
          ],
        };
      }
    );

    // ─── CREATE LIST ─────────────────────────────────────────
    server.registerTool(
      "create_list",
      {
        title: "Create List",
        description: "Create a new list for grouping tasks",
        inputSchema: {
          title: z.string().describe("Name of the list (e.g. Work, Personal, Shopping)"),
          description: z.string().optional().describe("Optional description"),
          color: z.string().optional().describe("Hex color code (default: #6C63FF)"),
          deadline: z.string().optional().describe("Optional deadline in ISO format"),
        },
      },
      async ({ title, description, color, deadline }) => {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from("lists")
          .insert([
            {
              title,
              description: description || null,
              color: color || "#6C63FF",
              deadline: deadline || null,
            },
          ])
          .select();
        if (error) throw new Error(error.message);
        return {
          content: [
            {
              type: "text" as const,
              text: `List created!\n${JSON.stringify(data[0], null, 2)}`,
            },
          ],
        };
      }
    );

    // ─── LIST TASKS ──────────────────────────────────────────
    server.registerTool(
      "list_tasks",
      {
        title: "List Tasks",
        description:
          "Fetch tasks with optional filtering by list, status, or priority",
        inputSchema: {
          list_id: z.string().optional().describe("Filter by list ID"),
          is_completed: z
            .boolean()
            .optional()
            .describe("Filter by completed (true) or pending (false)"),
          priority: z
            .enum(["low", "medium", "high"])
            .optional()
            .describe("Filter by priority level"),
        },
      },
      async ({ list_id, is_completed, priority }) => {
        const supabase = getSupabase();
        let query = supabase
          .from("tasks")
          .select("id, title, description, is_completed, priority, due_date, position, created_at, list_id, lists(title, color)")
          .order("created_at", { ascending: false });
        if (list_id) query = query.eq("list_id", list_id);
        if (is_completed !== undefined) query = query.eq("is_completed", is_completed);
        if (priority) query = query.eq("priority", priority);

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(data || [], null, 2) },
          ],
        };
      }
    );

    // ─── CREATE TASK ─────────────────────────────────────────
    server.registerTool(
      "create_task",
      {
        title: "Create Task",
        description: "Add a new task to Task Buddy",
        inputSchema: {
          title: z.string().describe("Task title"),
          description: z.string().optional().describe("Detailed description or notes"),
          list_id: z.string().optional().describe("ID of the list this task belongs to"),
          priority: z
            .enum(["low", "medium", "high"])
            .optional()
            .describe("Priority level (default: medium)"),
          due_date: z
            .string()
            .optional()
            .describe("Due date/time in ISO format (e.g. 2026-07-30T17:00:00Z)"),
        },
      },
      async ({ title, description, list_id, priority, due_date }) => {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from("tasks")
          .insert([
            {
              title,
              description: description || null,
              list_id: list_id || null,
              priority: priority || "medium",
              due_date: due_date || null,
              is_completed: false,
              position: 0,
            },
          ])
          .select();
        if (error) throw new Error(error.message);
        return {
          content: [
            {
              type: "text" as const,
              text: `Task created!\n${JSON.stringify(data[0], null, 2)}`,
            },
          ],
        };
      }
    );

    // ─── UPDATE TASK ─────────────────────────────────────────
    server.registerTool(
      "update_task",
      {
        title: "Update Task",
        description: "Update an existing task by its ID",
        inputSchema: {
          id: z.string().describe("ID of the task to update"),
          title: z.string().optional().describe("Updated title"),
          description: z.string().optional().describe("Updated description"),
          priority: z.enum(["low", "medium", "high"]).optional(),
          due_date: z.string().optional().describe("Updated due date ISO string"),
          is_completed: z.boolean().optional().describe("Mark completed status"),
        },
      },
      async ({ id, ...updates }) => {
        const supabase = getSupabase();
        // Filter out undefined values
        const cleanUpdates = Object.fromEntries(
          Object.entries(updates).filter(([, v]) => v !== undefined)
        );
        const { data, error } = await supabase
          .from("tasks")
          .update(cleanUpdates)
          .eq("id", id)
          .select();
        if (error) throw new Error(error.message);
        return {
          content: [
            {
              type: "text" as const,
              text: `Task updated!\n${JSON.stringify(data[0], null, 2)}`,
            },
          ],
        };
      }
    );

    // ─── COMPLETE TASK ───────────────────────────────────────
    server.registerTool(
      "complete_task",
      {
        title: "Complete Task",
        description: "Mark a task as completed or uncompleted",
        inputSchema: {
          id: z.string().describe("Task ID to complete"),
          is_completed: z
            .boolean()
            .optional()
            .describe("true to complete, false to mark pending (default: true)"),
        },
      },
      async ({ id, is_completed }) => {
        const supabase = getSupabase();
        const completed = is_completed !== undefined ? is_completed : true;
        const { data, error } = await supabase
          .from("tasks")
          .update({ is_completed: completed })
          .eq("id", id)
          .select();
        if (error) throw new Error(error.message);
        return {
          content: [
            {
              type: "text" as const,
              text: `Task marked as ${completed ? "completed ✅" : "pending ⏳"}.\n${JSON.stringify(data[0], null, 2)}`,
            },
          ],
        };
      }
    );

    // ─── DELETE TASK ─────────────────────────────────────────
    server.registerTool(
      "delete_task",
      {
        title: "Delete Task",
        description: "Delete a task by its ID",
        inputSchema: {
          id: z.string().describe("ID of the task to delete"),
        },
      },
      async ({ id }) => {
        const supabase = getSupabase();
        const { error } = await supabase.from("tasks").delete().eq("id", id);
        if (error) throw new Error(error.message);
        return {
          content: [
            { type: "text" as const, text: `Task ${id} deleted successfully.` },
          ],
        };
      }
    );

    // ─── SEARCH TASKS ────────────────────────────────────────
    server.registerTool(
      "search_tasks",
      {
        title: "Search Tasks",
        description: "Search tasks by matching text in title or description",
        inputSchema: {
          query: z.string().describe("Search keyword"),
        },
      },
      async ({ query }) => {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from("tasks")
          .select("id, title, description, is_completed, priority, due_date, created_at")
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(data || [], null, 2) },
          ],
        };
      }
    );
  },
  {},
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: false,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
