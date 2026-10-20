import type { TaskPriority, TaskStatus } from "../../types/task.ts";

export const STATUS_COLOR: Record<TaskStatus, string> = {
  new: "#2563EB",
  in_progress: "#D97706",
  done: "#16A34A",
};

export const PRIORITY_COLOR: Record<
  TaskPriority,
  { backgroundColor: string; color: string }
> = {
  low: { backgroundColor: "#F3F4F6", color: "#6B7280" },
  medium: { backgroundColor: "#FEF3C7", color: "#B45309" },
  high: { backgroundColor: "#FEE2E2", color: "#B91C1C" },
};
