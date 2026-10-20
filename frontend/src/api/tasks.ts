import type { Task, TaskPriority, TaskStatus } from "../types/task.ts";
import { request } from "./client.ts";

export type CreateTaskBody = {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
};

export type UpdateTaskBody = {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
};

export function listTasks(): Promise<Task[]> {
  return request<Task[]>("/api/tasks");
}

export function getTask(id: string): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`);
}

export function createTask(body: CreateTaskBody): Promise<Task> {
  return request<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateTask(id: string, body: UpdateTaskBody): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function moveTask(id: string, status: TaskStatus): Promise<Task> {
  return request<Task>(`/api/tasks/${id}/move`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteTask(id: string): Promise<void> {
  return request<void>(`/api/tasks/${id}`, {
    method: "DELETE",
  });
}
