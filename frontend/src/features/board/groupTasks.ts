import {
  TASK_COLUMN_ORDER,
  type Task,
  type TaskStatus,
} from "../../types/task.ts";

export type TaskColumnGroup = {
  status: TaskStatus;
  tasks: Task[];
};

export function groupTasks(tasks: Task[]): TaskColumnGroup[] {
  const tasksByStatus = new Map<TaskStatus, Task[]>(
    TASK_COLUMN_ORDER.map((status) => [status, []]),
  );

  for (const task of tasks) {
    tasksByStatus.get(task.status)?.push(task);
  }

  return TASK_COLUMN_ORDER.map((status) => ({
    status,
    tasks: tasksByStatus.get(status) ?? [],
  }));
}
