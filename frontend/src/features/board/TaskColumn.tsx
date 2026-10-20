import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { TaskStatus } from "../../types/task.ts";
import { STATUS_COLOR } from "./boardColors.ts";

type TaskColumnProps = {
  title: string;
  status: TaskStatus;
  count: number;
  children?: ReactNode;
};

export function TaskColumn({
  title,
  status,
  count,
  children,
}: TaskColumnProps) {
  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        gap: 2,
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        p: 2,
        bgcolor: "background.paper",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, minWidth: 0 }}>
        <Box
          aria-hidden
          sx={{
            width: 8,
            height: 8,
            flexShrink: 0,
            borderRadius: "50%",
            bgcolor: STATUS_COLOR[status],
          }}
        />
        <Typography
          component="h2"
          variant="h6"
          sx={{ minWidth: 0, overflowWrap: "break-word" }}
        >
          {title}
        </Typography>
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            minWidth: 22,
            height: 22,
            px: 0.75,
            borderRadius: 999,
            bgcolor: "background.default",
            color: "text.secondary",
            fontSize: "0.75rem",
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {count}
        </Box>
      </Stack>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: 0,
          height: "100%",
          overflow: "auto",
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}
