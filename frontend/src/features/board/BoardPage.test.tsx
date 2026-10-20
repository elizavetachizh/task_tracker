import "@testing-library/jest-dom/vitest";
import { ThemeProvider } from "@mui/material/styles";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTask, listTasks, moveTask } from "../../api/tasks.ts";
import theme from "../../theme.ts";
import type { Task } from "../../types/task.ts";
import { BoardPage } from "./BoardPage.tsx";
import { STALE_LIST_MESSAGE } from "./useTasks.ts";

vi.mock("../../api/tasks.ts", () => ({
  listTasks: vi.fn(),
  getTask: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  moveTask: vi.fn(),
  deleteTask: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function makeTask(id: string): Task {
  return {
    id,
    title: id,
    description: null,
    priority: "medium",
    status: "new",
    position: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("BoardPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("closes the dialog and offers to reload when the saved list fails to refresh", async () => {
    const user = userEvent.setup();
    const initial = [makeTask("task-1")];
    const refreshed = [makeTask("task-1"), makeTask("task-2")];
    vi.mocked(listTasks)
      .mockResolvedValueOnce(initial)
      .mockRejectedValueOnce(new Error("Не удалось загрузить задачи"))
      .mockResolvedValueOnce(refreshed);
    vi.mocked(createTask).mockResolvedValue(makeTask("task-2"));

    render(
      <ThemeProvider theme={theme}>
        <BoardPage />
      </ThemeProvider>,
    );

    expect(
      (await screen.findAllByRole("button", { name: "Открыть задачу task-1" }))
        .length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Новая задача" }));
    await user.type(
      screen.getByRole("textbox", { name: "Название" }),
      "task-2",
    );
    await user.click(screen.getByRole("button", { name: "Создать" }));

    expect(await screen.findByText(STALE_LIST_MESSAGE)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(createTask).toHaveBeenCalledTimes(1);
    expect(
      screen.getAllByRole("button", { name: "Открыть задачу task-1" }).length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Повторить" }));

    expect(
      (await screen.findAllByRole("button", { name: "Открыть задачу task-2" }))
        .length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(STALE_LIST_MESSAGE)).not.toBeInTheDocument();
  });

  it("disables create and move while a mutation is in flight", async () => {
    const user = userEvent.setup();
    const task = makeTask("task-1");
    const movePending = deferred<Task>();
    vi.mocked(listTasks).mockResolvedValue([task]);
    vi.mocked(moveTask).mockReturnValue(movePending.promise);

    render(
      <ThemeProvider theme={theme}>
        <BoardPage />
      </ThemeProvider>,
    );

    const moveButtons = await screen.findAllByRole("button", {
      name: "В работе",
    });
    expect(screen.getByRole("button", { name: "Новая задача" })).toBeEnabled();

    await user.click(moveButtons[0]);

    expect(screen.getByRole("button", { name: "Новая задача" })).toBeDisabled();
    for (const button of screen.getAllByRole("button", { name: "В работе" })) {
      expect(button).toBeDisabled();
    }
    for (const button of screen.getAllByRole("button", { name: "Готово" })) {
      expect(button).toBeDisabled();
    }
    expect(screen.getAllByRole("button", { name: "Открыть" })[0]).toBeEnabled();
    expect(screen.getAllByRole("button", { name: "Удалить" })[0]).toBeEnabled();
    expect(moveTask).toHaveBeenCalledTimes(1);

    await act(async () => {
      movePending.resolve({ ...task, status: "in_progress" });
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Новая задача" })).toBeEnabled();
    });
    expect(moveTask).toHaveBeenCalledTimes(1);
  });
});
