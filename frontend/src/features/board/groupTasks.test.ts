import { describe, expect, it } from "vitest";
import {
  TASK_COLUMN_ORDER,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../../types/task.ts";
import { groupTasks } from "./groupTasks.ts";

function makeTask(
  id: string,
  status: TaskStatus,
  priority: TaskPriority = "medium",
): Task {
  return {
    id,
    title: id,
    description: null,
    priority,
    status,
    position: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("groupTasks", () => {
  it("puts each status into its own column", () => {
    const columns = groupTasks([
      makeTask("new-task", "new"),
      makeTask("progress-task", "in_progress"),
      makeTask("done-task", "done"),
    ]);

    expect(columns.map((column) => column.status)).toEqual([
      ...TASK_COLUMN_ORDER,
    ]);
    expect(columns.map((column) => column.tasks.map((task) => task.id))).toEqual(
      [["new-task"], ["progress-task"], ["done-task"]],
    );
  });

  it("keeps the input order inside a column", () => {
    const columns = groupTasks([
      makeTask("first", "in_progress"),
      makeTask("second", "in_progress"),
      makeTask("other", "done"),
      makeTask("third", "in_progress"),
    ]);

    const inProgress = columns.find((column) => column.status === "in_progress");

    expect(inProgress?.tasks.map((task) => task.id)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("keeps an empty array when a status is missing", () => {
    const columns = groupTasks([
      makeTask("only-new", "new"),
      makeTask("also-new", "new"),
    ]);

    expect(columns).toHaveLength(TASK_COLUMN_ORDER.length);
    expect(columns.map((column) => column.status)).toEqual([
      ...TASK_COLUMN_ORDER,
    ]);
    expect(columns.map((column) => column.tasks.map((task) => task.id))).toEqual([
      ["only-new", "also-new"],
      [],
      [],
    ]);
  });

  it("returns three empty columns for an empty input", () => {
    const columns = groupTasks([]);

    expect(columns).toHaveLength(3);
    expect(columns.map((column) => column.status)).toEqual([
      "new",
      "in_progress",
      "done",
    ]);
    expect(columns.every((column) => column.tasks.length === 0)).toBe(true);
  });
});
