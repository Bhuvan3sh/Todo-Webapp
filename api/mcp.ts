import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gjduzipwtybvzvgefrza.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZHV6aXB3dHlidnp2Z2VmcnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjI5NTYsImV4cCI6MjEwMDc5ODk1Nn0.Gwf4ZGAfOfS-5JNaqFlqeGq1f4jbdctwSU98M70uHIw";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers for AI clients & ChatGPT
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract auth token if provided by client
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace('Bearer ', '') : undefined;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });

  if (req.method === 'GET') {
    // Return list of available MCP tools
    return res.status(200).json({
      name: "task-buddy-remote-mcp",
      version: "1.0.0",
      description: "Remote Task Buddy MCP API for ChatGPT & LLM Agents",
      tools: [
        { name: "list_tasks", description: "List tasks" },
        { name: "create_task", description: "Create task" },
        { name: "update_task", description: "Update task" },
        { name: "complete_task", description: "Complete task" },
        { name: "delete_task", description: "Delete task" },
        { name: "list_lists", description: "List todo lists" },
        { name: "create_list", description: "Create new list" },
        { name: "search_tasks", description: "Search tasks" },
      ]
    });
  }

  if (req.method === 'POST') {
    const { action, ...payload } = req.body || {};

    try {
      if (action === 'list_tasks') {
        let query = supabase.from('tasks').select('*, lists(title, color)').order('created_at', { ascending: false });
        if (payload.is_completed !== undefined) query = query.eq('is_completed', payload.is_completed);
        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json({ success: true, tasks: data });
      }

      if (action === 'create_task') {
        const { data, error } = await supabase.from('tasks').insert([{
          title: payload.title,
          description: payload.description || null,
          list_id: payload.list_id || null,
          priority: payload.priority || 'medium',
          due_date: payload.due_date || null,
          is_completed: false,
          position: 0,
        }]).select();
        if (error) throw error;
        return res.status(200).json({ success: true, task: data[0] });
      }

      if (action === 'complete_task') {
        const { data, error } = await supabase.from('tasks').update({ is_completed: payload.is_completed ?? true }).eq('id', payload.id).select();
        if (error) throw error;
        return res.status(200).json({ success: true, task: data[0] });
      }

      if (action === 'delete_task') {
        const { error } = await supabase.from('tasks').delete().eq('id', payload.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: `Task ${payload.id} deleted` });
      }

      if (action === 'list_lists') {
        const { data, error } = await supabase.from('lists').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json({ success: true, lists: data });
      }

      return res.status(400).json({ error: `Unknown action: ${action}` });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
