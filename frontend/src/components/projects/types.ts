import type { components } from "../../libs/api/openapi.gen.ts";

export type ProjectSettings = components["schemas"]["Settings"];
export type DatasetOverview = components["schemas"]["DatasetOverview"];
export type ColumnSummary = components["schemas"]["ColumnSummary"];
export type ProjectResult = NonNullable<components["schemas"]["GetProjectResponse"]["result"]>;
