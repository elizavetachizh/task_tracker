import { useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { CreateTaskBody, UpdateTaskBody } from "../../api/tasks.ts";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  type Task,
  type TaskPriority,
} from "../../types/task.ts";
import { PRIORITY_COLOR } from "./boardColors.ts";
import { errorMessage } from "./errorMessage.ts";

export type TaskDialogMode = "create" | "view" | "edit";

const DIALOG_TITLE: Record<TaskDialogMode, string> = {
  create: "Новая задача",
  view: "Задача",
  edit: "Редактирование",
};

type TaskDialogProps = {
  open: boolean;
  mode: TaskDialogMode;
  task: Task | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreate: (body: CreateTaskBody) => Promise<void>;
  onUpdate: (id: string, body: UpdateTaskBody) => Promise<void>;
};

type DeleteTaskDialogProps = {
  task: Task | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
};

function isTaskPriority(value: string): value is TaskPriority {
  return TASK_PRIORITIES.some((priority) => priority === value);
}

function emptyDescription(description: string): string | null {
  const trimmed = description.trim();
  return trimmed === "" ? null : trimmed;
}

const fieldSlotProps = (readOnly: boolean) => ({
  input: { readOnly },
});

export function TaskDialog({
  open,
  mode,
  task,
  onClose,
  onEdit,
  onDelete,
  onCreate,
  onUpdate,
}: TaskDialogProps) {
  const formIdentity = `${mode}:${task?.id ?? "create"}`;
  const [seen, setSeen] = useState({ identity: formIdentity, open: false });
  const [shownMode, setShownMode] = useState<TaskDialogMode>(mode);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const readOnly = shownMode === "view";

  if (open && (!seen.open || seen.identity !== formIdentity)) {
    setSeen({ identity: formIdentity, open: true });
    setShownMode(mode);
    setTitle(mode === "create" ? "" : (task?.title ?? ""));
    setDescription(mode === "create" ? "" : (task?.description ?? ""));
    setPriority(mode === "create" ? "medium" : (task?.priority ?? "medium"));
    setTitleError(null);
    setFormError(null);
    setSubmitting(false);
  } else if (!open && seen.open) {
    setSeen({ identity: formIdentity, open: false });
  }

  function closeDialog() {
    if (!submitting) {
      onClose();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!open || readOnly || submitting) {
      return;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle === "") {
      setTitleError("Введите название");
      return;
    }

    const body = {
      title: trimmedTitle,
      description: emptyDescription(description),
      priority,
    };

    setTitleError(null);
    setFormError(null);
    setSubmitting(true);

    try {
      if (shownMode === "create") {
        await onCreate(body);
      } else if (task) {
        await onUpdate(task.id, body);
      } else {
        setSubmitting(false);
        return;
      }
      onClose();
    } catch (error: unknown) {
      setFormError(errorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      fullWidth
      maxWidth="sm"
      aria-labelledby="task-dialog-title"
    >
      <DialogTitle id="task-dialog-title">
        {DIALOG_TITLE[shownMode]}
      </DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Stack
          component="form"
          id="task-dialog-form"
          noValidate
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          sx={{
            gap: 2,
            pt: 1,
            "& .MuiOutlinedInput-root": { borderRadius: "10px" },
          }}
        >
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          <TextField
            label="Название"
            name="title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (titleError) {
                setTitleError(null);
              }
            }}
            error={titleError !== null}
            helperText={titleError ?? undefined}
            fullWidth
            autoFocus={!readOnly}
            disabled={submitting}
            slotProps={fieldSlotProps(readOnly)}
          />
          <TextField
            label="Описание"
            name="description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
            multiline
            minRows={3}
            fullWidth
            disabled={submitting}
            slotProps={fieldSlotProps(readOnly)}
          />
          <TextField
            select
            label="Приоритет"
            name="priority"
            value={priority}
            onChange={(event) => {
              const nextPriority = event.target.value;
              if (isTaskPriority(nextPriority)) {
                setPriority(nextPriority);
              }
            }}
            fullWidth
            disabled={submitting}
            slotProps={{
              input: { readOnly },
              select: { readOnly },
            }}
          >
            {TASK_PRIORITIES.map((item) => (
              <MenuItem key={item} value={item}>
                {TASK_PRIORITY_LABELS[item]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1, px: 3, pt: 1, pb: 2 }}>
        {shownMode === "view" ? (
          <>
            <Button type="button" onClick={closeDialog}>
              Закрыть
            </Button>
            <Button type="button" color="error" onClick={onDelete}>
              Удалить
            </Button>
            <Button type="button" variant="contained" onClick={onEdit}>
              Изменить
            </Button>
          </>
        ) : (
          <>
            <Button type="button" onClick={closeDialog} disabled={submitting}>
              Отмена
            </Button>
            <Button
              type="submit"
              form="task-dialog-form"
              variant="contained"
              disabled={submitting}
            >
              {shownMode === "create" ? "Создать" : "Сохранить"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export function DeleteTaskDialog({
  task,
  onClose,
  onConfirm,
}: DeleteTaskDialogProps) {
  const open = task !== null;
  const [seenOpen, setSeenOpen] = useState(false);
  const [displayedTask, setDisplayedTask] = useState<Task | null>(task);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (open && !seenOpen) {
    setSeenOpen(true);
    setDisplayedTask(task);
    setSubmitting(false);
    setFormError(null);
  } else if (!open && seenOpen) {
    setSeenOpen(false);
  }

  function closeDialog() {
    if (!submitting) {
      onClose();
    }
  }

  async function handleConfirm() {
    if (!task || submitting) {
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      await onConfirm(task.id);
      onClose();
    } catch (error: unknown) {
      setFormError(errorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      fullWidth
      maxWidth="xs"
      aria-labelledby="delete-task-dialog-title"
    >
      <DialogTitle
        id="delete-task-dialog-title"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          pb: 1,
        }}
      >
        <Box
          component="span"
          aria-hidden
          sx={{
            display: "inline-flex",
            alignItems: "center",
            flexShrink: 0,
            px: 1,
            height: 22,
            borderRadius: "999px",
            bgcolor: PRIORITY_COLOR.high.backgroundColor,
            color: PRIORITY_COLOR.high.color,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          Удаление
        </Box>
        Удалить задачу?
      </DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Stack sx={{ gap: 1.5 }}>
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          {displayedTask ? (
            <DialogContentText sx={{ m: 0, overflowWrap: "break-word" }}>
              Удалить задачу «{displayedTask.title}»?
            </DialogContentText>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1, px: 3, pt: 0.5, pb: 2 }}>
        <Button type="button" onClick={closeDialog} disabled={submitting}>
          Отмена
        </Button>
        <Button
          type="button"
          color="error"
          variant="contained"
          disabled={submitting || !open}
          onClick={() => {
            void handleConfirm();
          }}
        >
          Удалить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
