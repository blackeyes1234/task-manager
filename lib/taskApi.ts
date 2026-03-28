import type { SupabaseClient } from "@supabase/supabase-js";
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

async function requireUserId(client: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) {
    throw error ?? new Error("Not authenticated");
  }
  return user.id;
}

async function nextTaskPosition(client: SupabaseClient): Promise<number> {
  const { data, error } = await client
    .from("tasks")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const max =
    data && typeof data === "object" && "position" in data
      ? Number((data as { position: number }).position)
      : NaN;
  if (!Number.isFinite(max)) return 0;
  return max + 1;
}

export async function listTasks(client: SupabaseClient): Promise<Task[]> {
  const { data, error } = await client
    .from("tasks")
    .select("id,title,completed,priority,due_date")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapRowToTask(row as TaskRow));
}

export async function createTask(
  client: SupabaseClient,
  input: {
    title: string;
    priority: Task["priority"];
    dueDate: string | null;
  }
): Promise<Task> {
  const userId = await requireUserId(client);
  const position = await nextTaskPosition(client);

  const { data, error } = await client
    .from("tasks")
    .insert({
      title: input.title,
      priority: input.priority,
      due_date: input.dueDate,
      completed: false,
      user_id: userId,
      position,
    })
    .select("id,title,completed,priority,due_date")
    .single();

  if (error) throw error;
  return mapRowToTask(data as TaskRow);
}

export async function updateTaskTitle(
  client: SupabaseClient,
  id: string,
  title: string
): Promise<Task> {
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
  client: SupabaseClient,
  id: string,
  completed: boolean
): Promise<Task> {
  const { data, error } = await client
    .from("tasks")
    .update({ completed })
    .eq("id", id)
    .select("id,title,completed,priority,due_date")
    .single();

  if (error) throw error;
  return mapRowToTask(data as TaskRow);
}

export async function deleteTaskById(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderTasks(
  client: SupabaseClient,
  orderedIds: string[]
): Promise<void> {
  if (orderedIds.length === 0) return;
  const { error } = await client.rpc("reorder_tasks", {
    p_ordered_ids: orderedIds,
  });
  if (error) throw error;
}
