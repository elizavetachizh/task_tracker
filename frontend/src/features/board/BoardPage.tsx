import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import SvgIcon from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import {
  TASK_COLUMN_ORDER,
  type Task,
  type TaskStatus,
} from "../../types/task.ts";
import { BoardColumns } from "./BoardColumns.tsx";
import { groupTasks } from "./groupTasks.ts";
import { DeleteTaskDialog, TaskDialog } from "./TaskDialog.tsx";
import { STALE_LIST_MESSAGE, useTasks, type BoardState } from "./useTasks.ts";

type ActiveDialog =
  | { mode: "create" }
  | { mode: "view" | "edit"; taskId: string };

function PlusIcon() {
  return (
    <SvgIcon fontSize="small">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" />
    </SvgIcon>
  );
}

function ColumnSkeletons() {
  return (
    <Box
      aria-busy="true"
      aria-label="Загрузка задач"
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          md: "repeat(3, minmax(0, 1fr))",
        },
        gridTemplateRows: "minmax(0, 1fr)",
        gap: 2,
        alignItems: "stretch",
        flex: 1,
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {TASK_COLUMN_ORDER.map((status, index) => (
        <Skeleton
          key={status}
          variant="rounded"
          animation="wave"
          sx={{
            height: "100%",
            minHeight: 0,
            borderRadius: 1,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            display: { xs: index === 0 ? "block" : "none", md: "block" },
          }}
        />
      ))}
    </Box>
  );
}

function BoardBody({
  state,
  mutating,
  onRetry,
  onCreate,
  onOpenTask,
  onDeleteTask,
  onMoveTask,
}: {
  state: BoardState;
  mutating: boolean;
  onRetry: () => void;
  onCreate: () => void;
  onOpenTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onMoveTask: (id: string, status: TaskStatus) => Promise<void>;
}) {
  if (state.status === "loading") {
    return <ColumnSkeletons />;
  }

  if (state.status === "error") {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" onClick={onRetry}>
            Повторить
          </Button>
        }
      >
        {state.message}
      </Alert>
    );
  }

  if (state.tasks.length === 0) {
    return (
      <Stack
        sx={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          height: "100%",
          textAlign: "center",
        }}
      >
        <Typography component="h2" variant="h6">
          Доска пуста
        </Typography>
        <Button
          type="button"
          variant="contained"
          disabled={mutating}
          startIcon={<PlusIcon />}
          onClick={onCreate}
        >
          Новая задача
        </Button>
      </Stack>
    );
  }

  return (
    <BoardColumns
      columns={groupTasks(state.tasks)}
      moveDisabled={mutating}
      onOpenTask={onOpenTask}
      onDeleteTask={onDeleteTask}
      onMoveTask={onMoveTask}
    />
  );
}

export function BoardPage() {
  const {
    state,
    mutationError,
    mutating,
    clearMutationError,
    reload,
    create,
    update,
    move,
    remove,
  } = useTasks();
  const [activeDialog, setActiveDialog] = useState<ActiveDialog | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

  const tasks = state.status === "ready" ? state.tasks : [];
  const selectedTask =
    activeDialog && activeDialog.mode !== "create"
      ? (tasks.find((task) => task.id === activeDialog.taskId) ?? null)
      : null;
  const taskDialogOpen =
    activeDialog?.mode === "create" || selectedTask !== null;
  const dialogVisible = taskDialogOpen || pendingDelete !== null;

  function openCreate() {
    clearMutationError();
    setActiveDialog({ mode: "create" });
  }

  function openTask(task: Task) {
    clearMutationError();
    setActiveDialog({ mode: "view", taskId: task.id });
  }

  function requestDelete(task: Task) {
    clearMutationError();
    setPendingDelete(task);
  }

  return (
    <Stack
      component="main"
      sx={{
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        height: "100dvh",
        overflow: "hidden",
        bgcolor: "background.default",
        p: 2,
        gap: 2,
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          flexShrink: 0,
          gap: 1,
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
        }}
      >
        <Typography
          component="h1"
          variant="h4"
          sx={{ minWidth: 0, overflowWrap: "break-word" }}
        >
          Задачи
        </Typography>
        <Button
          type="button"
          variant="contained"
          disabled={state.status !== "ready" || mutating}
          startIcon={<PlusIcon />}
          onClick={openCreate}
          sx={{ maxWidth: "100%", flexShrink: 0 }}
        >
          Новая задача
        </Button>
      </Stack>
      {state.status === "ready" && mutationError && !dialogVisible ? (
        <Alert
          severity="error"
          closeText="Закрыть"
          onClose={clearMutationError}
          action={
            mutationError === STALE_LIST_MESSAGE ? (
              <Button
                color="inherit"
                onClick={() => {
                  void reload();
                }}
              >
                Повторить
              </Button>
            ) : undefined
          }
        >
          {mutationError}
        </Alert>
      ) : null}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          width: "100%",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <BoardBody
          state={state}
          mutating={mutating}
          onRetry={() => {
            void reload();
          }}
          onCreate={openCreate}
          onOpenTask={openTask}
          onDeleteTask={requestDelete}
          onMoveTask={move}
        />
      </Box>
      <TaskDialog
        open={taskDialogOpen}
        mode={activeDialog?.mode ?? "create"}
        task={selectedTask}
        onClose={() => {
          setActiveDialog(null);
        }}
        onEdit={() => {
          if (selectedTask) {
            setActiveDialog({ mode: "edit", taskId: selectedTask.id });
          }
        }}
        onDelete={() => {
          if (selectedTask) {
            setPendingDelete(selectedTask);
          }
        }}
        onCreate={create}
        onUpdate={update}
      />
      <DeleteTaskDialog
        task={pendingDelete}
        onClose={() => {
          setPendingDelete(null);
        }}
        onConfirm={async (id) => {
          await remove(id);
          setActiveDialog(null);
        }}
      />
    </Stack>
  );
}
