import "@testing-library/jest-dom/vitest";
import { ThemeProvider } from "@mui/material/styles";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CreateTaskBody } from "../../api/tasks.ts";
import theme from "../../theme.ts";
import type { Task } from "../../types/task.ts";
import { TaskDialog } from "./TaskDialog.tsx";

function renderCreateDialog(onCreate: (body: CreateTaskBody) => Promise<void>) {
  render(
    <ThemeProvider theme={theme}>
      <TaskDialog
        open
        mode="create"
        task={null}
        onClose={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        onCreate={onCreate}
        onUpdate={() => Promise.resolve()}
      />
    </ThemeProvider>,
  );
}

describe("TaskDialog", () => {
  it("does not call create when the title is empty", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn<(body: CreateTaskBody) => Promise<void>>();
    renderCreateDialog(onCreate);

    await user.click(screen.getByRole("button", { name: "Создать" }));

    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByText("Введите название")).toBeInTheDocument();
  });

  it("calls create with a trimmed title and the selected priority", async () => {
    const user = userEvent.setup();
    const onCreate = vi
      .fn<(body: CreateTaskBody) => Promise<void>>()
      .mockResolvedValue(undefined);
    renderCreateDialog(onCreate);

    await user.type(
      screen.getByRole("textbox", { name: "Название" }),
      "  Купить хлеб  ",
    );
    await user.click(screen.getByRole("combobox", { name: "Приоритет" }));
    await user.click(screen.getByRole("option", { name: "Высокий" }));
    await user.click(screen.getByRole("button", { name: "Создать" }));

    expect(onCreate).toHaveBeenCalledWith({
      title: "Купить хлеб",
      description: null,
      priority: "high",
    });
  });

  it("keeps view fields readable and unchanged", async () => {
    const user = userEvent.setup();
    const task: Task = {
      id: "task-1",
      title: "Купить хлеб",
      description: "Бородинский",
      priority: "low",
      status: "new",
      position: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    render(
      <ThemeProvider theme={theme}>
        <TaskDialog
          open
          mode="view"
          task={task}
          onClose={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          onCreate={() => Promise.resolve()}
          onUpdate={() => Promise.resolve()}
        />
      </ThemeProvider>,
    );

    const title = screen.getByRole("textbox", { name: "Название" });
    const description = screen.getByRole("textbox", { name: "Описание" });
    const priority = screen.getByRole("combobox", { name: "Приоритет" });

    expect(title).toHaveValue("Купить хлеб");
    expect(title).toHaveAttribute("readonly");
    expect(title).toBeEnabled();
    expect(description).toHaveValue("Бородинский");
    expect(description).toHaveAttribute("readonly");
    expect(description).toBeEnabled();
    expect(priority).toHaveAttribute("aria-readonly", "true");
    expect(priority).toBeEnabled();

    await user.type(title, "ещё");
    await user.click(priority);

    expect(title).toHaveValue("Купить хлеб");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Высокий" }),
    ).not.toBeInTheDocument();
  });
});
