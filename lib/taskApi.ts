import { assertSupabaseConfigured } from "@/lib/supabaseClient";
import type { Task } from "@/lib/types";
import { parseDueDate, parseTaskPriority } from "@/lib/types";

type TaskRow = {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  due_date: string | null;
};

function mapRowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    priority: parseTaskPriority(row.priority),
    dueDate: parseDueDate(row.due_date),
  };
}

export async function listTasks(): Promise<Task[]> {
  const client = assertSupabaseConfigured();
  const { data, error } = await client
    .from("tasks")
    .select("id,title,completed,priority,due_date")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapRowToTask(row as TaskRow));
}

export async function createTask(input: {
  title: string;
  priority: Task["priority"];
  dueDate: string | null;
}): Promise<Task> {
  const client = assertSupabaseConfigured();
  const { data, error } = await client
    .from("tasks")
    .insert({
      title: input.title,
      priority: input.priority,
      due_date: input.dueDate,
      completed: false,
    })
    .select("id,title,completed,priority,due_date")
    .single();

  if (error) throw error;
  return mapRowToTask(data as TaskRow);
}

export async function updateTaskTitle(id: string, title: string): Promise<Task> {
  const client = assertSupabaseConfigured();
  const { data, error } = await client
    .from("tasks")
    .update({ title })
    .eq("id", id)
    .select("id,title,completed,priority,due_date")
    .single();

  if (error) throw error;
  return mapRowToTask(data as TaskRow);
}

export async function updateTaskCompleted(
  id: string,
  completed: boolean
): Promise<Task> {
  const client = assertSupabaseConfigured();
  const { data, error } = await client
    .from("tasks")
    .update({ completed })
    .eq("id", id)
    .select("id,title,completed,priority,due_date")
    .single();

  if (error) throw error;
  return mapRowToTask(data as TaskRow);
}

export async function deleteTaskById(id: string): Promise<void> {
  const client = assertSupabaseConfigured();
  const { error } = await client.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
