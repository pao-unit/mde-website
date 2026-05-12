import type { components } from "../../../libs/api/openapi.gen.ts";
import {
	areFoldRangesOrdered,
	type FoldRanges,
	getDefaultFoldRanges,
	isValidPointRange,
	type PointRangeDraft,
	sanitizeFoldRanges,
} from "./foldRanges.ts";

export type ProjectSettings = components["schemas"]["AnalysisSettings"];
export type AnalysisBackend = NonNullable<ProjectSettings["backend"]>;
export type VariableRole = "target" | "candidate" | "excluded";

export type SettingsDraft = {
	backend?: string | null;
	targets?: readonly string[] | null;
	excludeColumns?: readonly string[] | null;
	maxVariables?: number | string | null;
	libraryRange?: PointRangeDraft | null;
	predictionRange?: PointRangeDraft | null;
	holdoutRange?: PointRangeDraft | null;
	seed?: number | string | null;
	prefilterThreshold?: number | string | null;
};

export type SettingsOptions = {
	columnNames?: readonly string[];
	defaultRanges?: FoldRanges;
	totalPoints?: number;
};

export type SettingsValidationIssue = {
	field: keyof ProjectSettings | "ranges";
	message: string;
};

export class SettingsValidationError extends Error {
	readonly issues: SettingsValidationIssue[];

	constructor(issues: readonly SettingsValidationIssue[]) {
		super(issues.map((issue) => issue.message).join(" "));
		this.name = "SettingsValidationError";
		this.issues = [...issues];
	}
}

export const ANALYSIS_BACKENDS = ["edmkit", "dimx"] as const satisfies readonly AnalysisBackend[];
export const DEFAULT_ANALYSIS_BACKEND: AnalysisBackend = "edmkit";
export const DEFAULT_MAX_VARIABLES = 6;
export const DEFAULT_SEED = 0;
export const DEFAULT_PREFILTER_THRESHOLD = 0;
export const PREFILTER_THRESHOLD_MIN = 0;
export const PREFILTER_THRESHOLD_MAX = 1;

export function initSettings(
	draft: SettingsDraft | ProjectSettings | null | undefined,
	options: SettingsOptions = {},
): ProjectSettings {
	const settings = sanitizeSettings(draft ?? {}, options);

	if (settings.targets.length > 0 || !options.columnNames?.[0]) {
		return settings;
	}

	return assignVariableRole(settings, options.columnNames[0], "target", options);
}

export function sanitizeSettings(draft: SettingsDraft | ProjectSettings, options: SettingsOptions = {}): ProjectSettings {
	const allowedColumns = options.columnNames ? new Set(options.columnNames) : undefined;
	const backend = coerceAnalysisBackend(draft.backend);
	const targets = normalizeTargetsForBackend(sanitizeColumnList(draft.targets, allowedColumns), backend);
	const excludeColumns = sanitizeColumnList(draft.excludeColumns, allowedColumns).filter((name) => !targets.includes(name));
	const defaultRanges = options.defaultRanges ?? getDefaultFoldRanges(options.totalPoints ?? 0);
	const ranges = sanitizeFoldRanges(
		{
			libraryRange: draft.libraryRange,
			predictionRange: draft.predictionRange,
			holdoutRange: draft.holdoutRange,
		},
		{ defaultRanges, totalPoints: options.totalPoints },
	);

	return {
		backend,
		targets,
		excludeColumns,
		maxVariables: coercePositiveInteger(draft.maxVariables, DEFAULT_MAX_VARIABLES),
		libraryRange: ranges.libraryRange,
		predictionRange: ranges.predictionRange,
		holdoutRange: ranges.holdoutRange,
		seed: coerceInteger(draft.seed, DEFAULT_SEED),
		prefilterThreshold: coercePrefilterThreshold(draft.prefilterThreshold),
	};
}

export function validateSettings(
	settings: ProjectSettings,
	options: Pick<SettingsOptions, "columnNames" | "totalPoints"> = {},
): SettingsValidationIssue[] {
	const issues: SettingsValidationIssue[] = [];
	const knownColumns = options.columnNames ? new Set(options.columnNames) : undefined;

	if (!ANALYSIS_BACKENDS.includes(settings.backend ?? DEFAULT_ANALYSIS_BACKEND)) {
		issues.push({ field: "backend", message: "Choose a supported analysis backend." });
	}

	if (settings.targets.length === 0) {
		issues.push({ field: "targets", message: "Select at least one target column." });
	}
	if (settings.backend === "dimx" && settings.targets.length !== 1) {
		issues.push({ field: "targets", message: "dimx backend supports exactly one target column." });
	}

	validateColumnList("targets", settings.targets, knownColumns, issues);
	validateColumnList("excludeColumns", settings.excludeColumns ?? [], knownColumns, issues);

	for (const excluded of settings.excludeColumns ?? []) {
		if (settings.targets.includes(excluded)) {
			issues.push({ field: "excludeColumns", message: `Target column cannot also be excluded: ${excluded}.` });
		}
	}

	if (!Number.isInteger(settings.maxVariables) || settings.maxVariables < 1) {
		issues.push({ field: "maxVariables", message: "Maximum variables must be at least 1." });
	}
	if (!Number.isInteger(settings.seed)) {
		issues.push({ field: "seed", message: "Seed must be an integer." });
	}
	if (
		typeof settings.prefilterThreshold !== "number" ||
		!Number.isFinite(settings.prefilterThreshold) ||
		settings.prefilterThreshold < PREFILTER_THRESHOLD_MIN ||
		settings.prefilterThreshold > PREFILTER_THRESHOLD_MAX
	) {
		issues.push({
			field: "prefilterThreshold",
			message: `Pre-filter threshold must be between ${PREFILTER_THRESHOLD_MIN} and ${PREFILTER_THRESHOLD_MAX}.`,
		});
	}

	validateRange("libraryRange", settings.libraryRange, options.totalPoints, issues);
	validateRange("predictionRange", settings.predictionRange, options.totalPoints, issues);
	validateRange("holdoutRange", settings.holdoutRange, options.totalPoints, issues);

	if (!areFoldRangesOrdered(settings)) {
		if (settings.libraryRange.end >= settings.predictionRange.start) {
			issues.push({ field: "ranges", message: "Library range must end before the prediction range starts." });
		}
		if (settings.predictionRange.end >= settings.holdoutRange.start) {
			issues.push({ field: "ranges", message: "Prediction range must end before the holdout range starts." });
		}
	}

	return issues;
}

export function assignVariableRole(
	settings: ProjectSettings,
	columnName: string,
	role: VariableRole,
	options: Pick<SettingsOptions, "columnNames"> = {},
): ProjectSettings {
	const column = columnName.trim();
	if (!column || (options.columnNames && !options.columnNames.includes(column))) {
		return settings;
	}

	if (role === "target") {
		const targets = settings.backend === "dimx" ? [column] : unique([...settings.targets, column]);
		return {
			...settings,
			targets,
			excludeColumns: (settings.excludeColumns ?? []).filter((name) => name !== column),
		};
	}

	if (role === "excluded") {
		return {
			...settings,
			targets: settings.targets.filter((name) => name !== column),
			excludeColumns: unique([...(settings.excludeColumns ?? []).filter((name) => name !== column), column]),
		};
	}

	return {
		...settings,
		targets: settings.targets.filter((name) => name !== column),
		excludeColumns: (settings.excludeColumns ?? []).filter((name) => name !== column),
	};
}

export function setBackend(
	settings: ProjectSettings,
	backend: AnalysisBackend,
	options: Pick<SettingsOptions, "columnNames"> = {},
): ProjectSettings {
	const nextBackend = coerceAnalysisBackend(backend);
	let targets = settings.targets;

	if (nextBackend === "dimx") {
		targets = targets[0] ? [targets[0]] : options.columnNames?.[0] ? [options.columnNames[0]] : [];
	}

	return {
		...settings,
		backend: nextBackend,
		targets,
		excludeColumns: (settings.excludeColumns ?? []).filter((name) => !targets.includes(name)),
	};
}

function normalizeTargetsForBackend(targets: string[], backend: AnalysisBackend): string[] {
	return backend === "dimx" ? targets.slice(0, 1) : targets;
}

function sanitizeColumnList(values: readonly string[] | null | undefined, allowedColumns?: ReadonlySet<string>): string[] {
	if (!values) return [];

	const result: string[] = [];
	const seen = new Set<string>();

	for (const value of values) {
		const name = value.trim();
		if (!name || seen.has(name)) continue;
		if (allowedColumns && !allowedColumns.has(name)) continue;
		seen.add(name);
		result.push(name);
	}

	return result;
}

function validateColumnList(
	field: "targets" | "excludeColumns",
	values: readonly string[],
	knownColumns: ReadonlySet<string> | undefined,
	issues: SettingsValidationIssue[],
): void {
	const seen = new Set<string>();

	for (const value of values) {
		if (!value.trim()) {
			issues.push({ field, message: `${field} cannot include blank column names.` });
			continue;
		}
		if (seen.has(value)) {
			issues.push({ field, message: `${field} cannot include duplicate column names: ${value}.` });
		}
		if (knownColumns && !knownColumns.has(value)) {
			issues.push({ field, message: `Unknown ${field === "targets" ? "target" : "excluded"} column: ${value}.` });
		}
		seen.add(value);
	}
}

function validateRange(
	field: "libraryRange" | "predictionRange" | "holdoutRange",
	range: ProjectSettings[typeof field],
	totalPoints: number | undefined,
	issues: SettingsValidationIssue[],
): void {
	if (!isValidPointRange(range, totalPoints)) {
		issues.push({ field, message: `${field} must be a valid 1-indexed point range.` });
	}
}

function coerceAnalysisBackend(value: string | null | undefined): AnalysisBackend {
	return value === "dimx" || value === "edmkit" ? value : DEFAULT_ANALYSIS_BACKEND;
}

function coercePositiveInteger(value: number | string | null | undefined, fallback: number): number {
	return Math.max(1, coerceInteger(value, fallback));
}

function coercePrefilterThreshold(value: number | string | null | undefined): number {
	const parsed = coerceFiniteNumber(value, DEFAULT_PREFILTER_THRESHOLD);
	return Math.min(Math.max(parsed, PREFILTER_THRESHOLD_MIN), PREFILTER_THRESHOLD_MAX);
}

function coerceInteger(value: number | string | null | undefined, fallback: number): number {
	const parsed = coerceFiniteNumber(value, fallback);
	return Math.floor(parsed);
}

function coerceFiniteNumber(value: number | string | null | undefined, fallback: number): number {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim()) {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return fallback;
}

function unique(values: readonly string[]): string[] {
	return [...new Set(values)];
}
