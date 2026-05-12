import type { AnalysisRunStatus, ProjectDetail } from "./model.ts";

export type ProjectWorkflow = "draft" | AnalysisRunStatus;

export function deriveProjectWorkflow(project: ProjectDetail | null | undefined): ProjectWorkflow {
	return project?.latestRun?.status ?? "draft";
}

export function isAnalysisActive(status: ProjectWorkflow): boolean {
	return status === "queued" || status === "running";
}
