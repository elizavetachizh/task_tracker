import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTask, listTasks, moveTask } from "../../api/tasks.ts";
import type { Task, TaskPriority, TaskStatus } from "../../types/task.ts";
import { STALE_LIST_MESSAGE, useTasks } from "./useTasks.ts";

vi.mock("../../api/tasks.ts", () => ({
  listTasks: vi.fn(),
  getTask: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  moveTask: vi.fn(),
  deleteTask: vi.fn(),
}));

function makeTask(
  id: string,
  status: TaskStatus = "new",
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("useTasks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("is loading on the first render and then becomes ready", async () => {
    const tasks = [makeTask("task-1")];
    const pending = deferred<Task[]>();
    vi.mocked(listTasks).mockReturnValue(pending.promise);

    const { result } = renderHook(() => useTasks());

    expect(result.current.state).toEqual({ status: "loading" });

    await act(async () => {
      pending.resolve(tasks);
      await pending.promise;
    });

    expect(result.current.state).toEqual({ status: "ready", tasks });
  });

  it("stores the error text when listTasks fails", async () => {
    vi.mocked(listTasks).mockRejectedValue(
      new Error("Не удалось загрузить задачи"),
    );

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.state).toEqual({
        status: "error",
        message: "Не удалось загрузить задачи",
      });
    });
  });

  it("reaches ready when reload succeeds after an error", async () => {
    const tasks = [makeTask("task-1")];
    vi.mocked(listTasks).mockRejectedValueOnce(
      new Error("Не удалось загрузить задачи"),
    );

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.state).toEqual({
        status: "error",
        message: "Не удалось загрузить задачи",
      });
    });

    vi.mocked(listTasks).mockResolvedValueOnce(tasks);

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.state).toEqual({ status: "ready", tasks });
  });

  it("calls listTasks again after a successful create", async () => {
    const initial = [makeTask("task-1")];
    const created = makeTask("task-2", "new", "high");
    vi.mocked(listTasks)
      .mockResolvedValueOnce(initial)
      .mockResolvedValueOnce([...initial, created]);
    vi.mocked(createTask).mockResolvedValue(created);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: "ready", tasks: initial });
    });

    await act(async () => {
      await result.current.create({
        title: "task-2",
        description: null,
        priority: "high",
      });
    });

    expect(listTasks).toHaveBeenCalledTimes(2);
    expect(result.current.state).toEqual({
      status: "ready",
      tasks: [...initial, created],
    });
    expect(result.current.mutationError).toBeNull();
  });

  it("rejects a failed write and does not refresh the list", async () => {
    const initial = [makeTask("task-1")];
    vi.mocked(listTasks).mockResolvedValue(initial);
    vi.mocked(createTask).mockRejectedValue(new Error("Название уже занято"));

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: "ready", tasks: initial });
    });

    await act(async () => {
      await expect(
        result.current.create({
          title: "task-2",
          description: null,
          priority: "medium",
        }),
      ).rejects.toThrow("Название уже занято");
    });

    expect(listTasks).toHaveBeenCalledTimes(1);
    expect(result.current.state).toEqual({ status: "ready", tasks: initial });
    expect(result.current.mutationError).toBe("Название уже занято");
    expect(result.current.mutating).toBe(false);
  });

  it("keeps the board when the write succeeds and the next list fails", async () => {
    const initial = [makeTask("task-1")];
    const created = makeTask("task-2");
    vi.mocked(listTasks)
      .mockResolvedValueOnce(initial)
      .mockRejectedValueOnce(new Error("Не удалось загрузить задачи"));
    vi.mocked(createTask).mockResolvedValue(created);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: "ready", tasks: initial });
    });

    await act(async () => {
      await result.current.create({
        title: "task-2",
        description: null,
        priority: "medium",
      });
    });

    expect(createTask).toHaveBeenCalledTimes(1);
    expect(listTasks).toHaveBeenCalledTimes(2);
    expect(result.current.state).toEqual({ status: "ready", tasks: initial });
    expect(result.current.mutationError).toBe(STALE_LIST_MESSAGE);
    expect(result.current.mutating).toBe(false);
  });

  it("reloads the list after a failed refresh", async () => {
    const initial = [makeTask("task-1")];
    const refreshed = [makeTask("task-1"), makeTask("task-2")];
    vi.mocked(listTasks)
      .mockResolvedValueOnce(initial)
      .mockRejectedValueOnce(new Error("Не удалось загрузить задачи"))
      .mockResolvedValueOnce(refreshed);
    vi.mocked(createTask).mockResolvedValue(makeTask("task-2"));

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: "ready", tasks: initial });
    });

    await act(async () => {
      await result.current.create({
        title: "task-2",
        description: null,
        priority: "medium",
      });
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.mutationError).toBeNull();
    expect(result.current.state).toEqual({ status: "ready", tasks: refreshed });
  });

  it("ignores a second mutation while the first is still running", async () => {
    const initial = [makeTask("task-1")];
    const moved = makeTask("task-1", "in_progress");
    const movePending = deferred<Task>();
    vi.mocked(listTasks).mockResolvedValue([moved]);
    vi.mocked(listTasks).mockResolvedValueOnce(initial);
    vi.mocked(moveTask).mockReturnValue(movePending.promise);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: "ready", tasks: initial });
    });

    expect(result.current.mutating).toBe(false);

    let firstMove!: Promise<void>;
    act(() => {
      firstMove = result.current.move("task-1", "in_progress");
    });

    expect(result.current.mutating).toBe(true);

    await act(async () => {
      await expect(result.current.move("task-1", "done")).rejects.toThrow(
        "Операция уже выполняется",
      );
    });

    expect(moveTask).toHaveBeenCalledTimes(1);
    expect(moveTask).toHaveBeenCalledWith("task-1", "in_progress");

    await act(async () => {
      movePending.resolve(moved);
      await firstMove;
    });

    expect(result.current.mutating).toBe(false);
    expect(result.current.state).toEqual({ status: "ready", tasks: [moved] });
    expect(result.current.mutationError).toBeNull();
  });
});
