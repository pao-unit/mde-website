import type { components, operations } from "../../../libs/api/openapi.gen.ts";

export type ProjectSummary = components["schemas"]["Project"];
export type ProjectDetail = components["schemas"]["ProjectDetail"];
export type AnalysisRun = components["schemas"]["AnalysisRun"];
export type AnalysisRunStatus = AnalysisRun["status"];
export type ProjectResult = components["schemas"]["Result"];
export type SelectionStep = components["schemas"]["SelectionStep"];
export type BestStep = components["schemas"]["BestStep"];
export type TargetPlot = components["schemas"]["TargetPlot"];
export type FoldSummary = components["schemas"]["FoldSummary"];
export type PrefilterSummary = components["schemas"]["PrefilterSummary"];
export type DatasetOverview = components["schemas"]["DatasetOverview"];
export type ColumnSummary = components["schemas"]["ColumnSummary"];

export type VariableSeries =
	operations["get_variables_api_projects__project_id__variables_get"]["responses"]["200"]["content"]["application/json"];

export type ProjectWorkflow = "draft" | AnalysisRunStatus;

export function deriveProjectWorkflow(project: ProjectDetail | null | undefined): ProjectWorkflow {
	return project?.latestRun?.status ?? "draft";
}

export function isAnalysisActive(status: ProjectWorkflow): boolean {
	return status === "queued" || status === "running";
}
