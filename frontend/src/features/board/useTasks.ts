import { useCallback, useEffect, useRef, useState } from "react";
import {
  createTask,
  deleteTask,
  listTasks,
  moveTask,
  updateTask,
  type CreateTaskBody,
  type UpdateTaskBody,
} from "../../api/tasks.ts";
import type { Task, TaskStatus } from "../../types/task.ts";
import { errorMessage } from "./errorMessage.ts";

export type BoardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; tasks: Task[] };

function asError(error: unknown): Error {
  if (error instanceof Error && error.message !== "") {
    return error;
  }

  return new Error(errorMessage(error));
}

export const STALE_LIST_MESSAGE = "Изменение сохранено, список не обновился";

const MUTATION_IN_PROGRESS_MESSAGE = "Операция уже выполняется";

function loadBoardState(): Promise<Exclude<BoardState, { status: "loading" }>> {
  return listTasks()
    .then((tasks) => ({ status: "ready" as const, tasks }))
    .catch((error: unknown) => ({
      status: "error" as const,
      message: errorMessage(error),
    }));
}

export function useTasks() {
  const [state, setState] = useState<BoardState>({ status: "loading" });
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const mutatingRef = useRef(false);

  const reload = useCallback(async () => {
    setMutationError(null);
    setState({ status: "loading" });
    setState(await loadBoardState());
  }, []);

  useEffect(() => {
    let active = true;

    void loadBoardState().then((next) => {
      if (active) {
        setState(next);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const runMutation = useCallback(async (mutate: () => Promise<unknown>) => {
    if (mutatingRef.current) {
      throw new Error(MUTATION_IN_PROGRESS_MESSAGE);
    }

    mutatingRef.current = true;
    setMutating(true);
    setMutationError(null);

    try {
      try {
        await mutate();
      } catch (error) {
        const failure = asError(error);
        setMutationError(failure.message);
        throw failure;
      }

      try {
        const tasks = await listTasks();
        setState({ status: "ready", tasks });
      } catch {
        setMutationError(STALE_LIST_MESSAGE);
      }
    } finally {
      mutatingRef.current = false;
      setMutating(false);
    }
  }, []);

  const create = useCallback(
    (body: CreateTaskBody) => runMutation(() => createTask(body)),
    [runMutation],
  );

  const update = useCallback(
    (id: string, body: UpdateTaskBody) =>
      runMutation(() => updateTask(id, body)),
    [runMutation],
  );

  const move = useCallback(
    (id: string, status: TaskStatus) => runMutation(() => moveTask(id, status)),
    [runMutation],
  );

  const remove = useCallback(
    (id: string) => runMutation(() => deleteTask(id)),
    [runMutation],
  );

  const clearMutationError = useCallback(() => {
    setMutationError(null);
  }, []);

  return {
    state,
    mutationError,
    mutating,
    clearMutationError,
    reload,
    create,
    update,
    move,
    remove,
  };
}
