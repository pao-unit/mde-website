import type { components } from "../../../libs/api/openapi.gen.ts";

export type ProjectSummary = components["schemas"]["Project"];
export type ProjectDetail = components["schemas"]["ProjectDetail"];
export type AnalysisRun = components["schemas"]["AnalysisRun"];
export type AnalysisRunStatus = AnalysisRun["status"];
export type ProjectResult = components["schemas"]["Result"];
export type PrefilterSummary = components["schemas"]["PrefilterSummary"];
export type DatasetOverview = components["schemas"]["DatasetOverview"];
export type ColumnSummary = components["schemas"]["ColumnSummary"];
export type ProjectSettings = components["schemas"]["AnalysisSettings"];
export type AnalysisBackend = NonNullable<ProjectSettings["backend"]>;
export type PointRange = components["schemas"]["PointRange"];
