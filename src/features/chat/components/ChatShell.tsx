import { Container, Stack } from "@mui/material";
import type { ReactNode } from "react";

export function ChatShell({ children }: { children: ReactNode }) {
  return (
    <Container disableGutters maxWidth="md">
      <Stack spacing={2}>{children}</Stack>
    </Container>
  );
}
