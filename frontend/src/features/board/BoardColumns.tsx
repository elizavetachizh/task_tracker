import { useState } from "react";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import {
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from "../../types/task.ts";
import type { TaskColumnGroup } from "./groupTasks.ts";
import { TaskCard } from "./TaskCard.tsx";
import { TaskColumn } from "./TaskColumn.tsx";

type BoardColumnsProps = {
  columns: TaskColumnGroup[];
  moveDisabled: boolean;
  onOpenTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onMoveTask: (id: string, status: TaskStatus) => Promise<void>;
};

type ColumnTasksProps = {
  column: TaskColumnGroup;
  moveDisabled: boolean;
  onOpenTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onMoveTask: (id: string, status: TaskStatus) => Promise<void>;
};

function ColumnTasks({
  column,
  moveDisabled,
  onOpenTask,
  onDeleteTask,
  onMoveTask,
}: ColumnTasksProps) {
  if (column.tasks.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100%",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Нет задач
        </Typography>
      </Box>
    );
  }

  return (
    <Stack sx={{ gap: 1, minWidth: 0 }}>
      {column.tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          moveDisabled={moveDisabled}
          onOpen={onOpenTask}
          onDelete={onDeleteTask}
          onMove={onMoveTask}
        />
      ))}
    </Stack>
  );
}

function StatusTabLabel({ label, count }: { label: string; count: number }) {
  return (
    <Badge
      badgeContent={count}
      color="primary"
      showZero
      sx={{
        display: "inline-flex",
        gap: 1,
        "& .MuiBadge-badge": {
          position: "static",
          transform: "none",
        },
      }}
    >
      {label}
    </Badge>
  );
}

export function BoardColumns({
  columns,
  moveDisabled,
  onOpenTask,
  onDeleteTask,
  onMoveTask,
}: BoardColumnsProps) {
  const [activeStatus, setActiveStatus] = useState<TaskStatus>("new");
  const activeColumn =
    columns.find((column) => column.status === activeStatus) ?? columns[0];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          display: { xs: "none", md: "grid" },
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gridTemplateRows: "minmax(0, 1fr)",
          gap: 2,
          alignItems: "stretch",
          flex: 1,
          minWidth: 0,
          minHeight: 0,
        }}
      >
        {columns.map((column) => (
          <TaskColumn
            key={column.status}
            title={TASK_STATUS_LABELS[column.status]}
            status={column.status}
            count={column.tasks.length}
          >
            <ColumnTasks
              column={column}
              moveDisabled={moveDisabled}
              onOpenTask={onOpenTask}
              onDeleteTask={onDeleteTask}
              onMoveTask={onMoveTask}
            />
          </TaskColumn>
        ))}
      </Box>
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          flexDirection: "column",
          flex: 1,
          gap: 2,
          width: "100%",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <Tabs
          value={activeColumn?.status ?? false}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Колонки задач"
          onChange={(_event, value: TaskStatus) => {
            setActiveStatus(value);
          }}
          sx={{ flexShrink: 0, maxWidth: "100%", minWidth: 0 }}
        >
          {columns.map((column) => (
            <Tab
              key={column.status}
              value={column.status}
              sx={{
                minWidth: 0,
                minHeight: 48,
                px: 1.5,
                textTransform: "none",
              }}
              label={
                <StatusTabLabel
                  label={TASK_STATUS_LABELS[column.status]}
                  count={column.tasks.length}
                />
              }
            />
          ))}
        </Tabs>
        {activeColumn ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minWidth: 0,
              minHeight: 0,
            }}
          >
            <TaskColumn
              title={TASK_STATUS_LABELS[activeColumn.status]}
              status={activeColumn.status}
              count={activeColumn.tasks.length}
            >
              <ColumnTasks
                column={activeColumn}
                moveDisabled={moveDisabled}
                onOpenTask={onOpenTask}
                onDeleteTask={onDeleteTask}
                onMoveTask={onMoveTask}
              />
            </TaskColumn>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
