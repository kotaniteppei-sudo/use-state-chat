import "server-only";

export function assertServerTrainingProject(
  projectId: string,
  allowedProjectIds = process.env.ALLOWED_TRAINING_PROJECT_IDS ?? "",
): void {
  const allowed = new Set(
    allowedProjectIds
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  if (!allowed.has(projectId)) throw new Error("project not allowed");
}
