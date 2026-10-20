import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  TASK_COLUMN_ORDER,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from "../../types/task.ts";
import { PRIORITY_COLOR } from "./boardColors.ts";

type TaskCardProps = {
  task: Task;
  moveDisabled: boolean;
  onOpen: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMove: (id: string, status: TaskStatus) => Promise<void>;
};

export function TaskCard({
  task,
  moveDisabled,
  onOpen,
  onDelete,
  onMove,
}: TaskCardProps) {
  const moveTargets = TASK_COLUMN_ORDER.filter(
    (status) => status !== task.status,
  );
  const priorityTone = PRIORITY_COLOR[task.priority];

  return (
    <Card
      variant="outlined"
      sx={{
        minWidth: 0,
        bgcolor: "background.paper",
        borderColor: "divider",
        transition:
          "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
        "&:hover": {
          borderColor: "#D0D5DD",
          boxShadow: "0 4px 12px rgba(16, 24, 40, 0.08)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <CardActionArea
        aria-label={`Открыть задачу ${task.title}`}
        onClick={() => {
          onOpen(task);
        }}
        sx={{ minWidth: 0, width: "100%" }}
      >
        <CardContent>
          <Stack sx={{ gap: 1, minWidth: 0 }}>
            <Typography
              component="h3"
              variant="subtitle1"
              sx={{ fontWeight: 600, overflowWrap: "break-word" }}
            >
              {task.title}
            </Typography>
            {task.description ? (
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  display: "-webkit-box",
                  overflow: "hidden",
                  overflowWrap: "break-word",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                }}
              >
                {task.description}
              </Typography>
            ) : null}
            <Chip
              size="small"
              label={TASK_PRIORITY_LABELS[task.priority]}
              sx={{
                alignSelf: "flex-start",
                fontWeight: 600,
                bgcolor: priorityTone.backgroundColor,
                color: priorityTone.color,
                border: "none",
              }}
            />
          </Stack>
        </CardContent>
      </CardActionArea>
      <Stack
        direction="row"
        sx={{
          flexWrap: "wrap",
          alignItems: "center",
          gap: 0.5,
          px: 1,
          py: 0.75,
          minWidth: 0,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Button
          type="button"
          size="small"
          onClick={() => {
            onOpen(task);
          }}
        >
          Открыть
        </Button>
        {moveTargets.map((status) => (
          <Button
            key={status}
            type="button"
            size="small"
            disabled={moveDisabled}
            onClick={() => {
              void onMove(task.id, status).catch(() => undefined);
            }}
            sx={{
              color: "text.secondary",
              "&.Mui-disabled": {
                color: "action.disabled",
              },
            }}
          >
            {TASK_STATUS_LABELS[status]}
          </Button>
        ))}
        <Button
          type="button"
          size="small"
          color="error"
          onClick={() => {
            onDelete(task);
          }}
          sx={{ ml: "auto" }}
        >
          Удалить
        </Button>
      </Stack>
    </Card>
  );
}
