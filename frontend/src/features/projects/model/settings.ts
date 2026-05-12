import type { components } from "../../../libs/api/openapi.gen.ts";
import {
	clampPointRange,
	type FoldRanges,
	getDefaultFoldRanges,
	isValidPointRange,
	type PointRange,
	toPointRange,
} from "./foldRanges.ts";

export type ProjectSettings = components["schemas"]["AnalysisSettings"];
export type AnalysisBackend = NonNullable<ProjectSettings["backend"]>;

export type PointRangeDraft =
	| PointRange
	| readonly [number | string | null | undefined, number | string | null | undefined]
	| {
		start?: number | string | null;
		end?: number | string | null;
	};

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

export type SettingsSanitizeOptions = {
	columnNames?: readonly string[];
	defaultRanges?: FoldRanges;
	totalPoints?: number;
};

export type SettingsValidationIssue = {
	field: keyof ProjectSettings | "ranges";
	message: string;
};

export const DEFAULT_MAX_VARIABLES = 6;
export const DEFAULT_SEED = 0;
export const DEFAULT_PREFILTER_THRESHOLD = 0;
export const DEFAULT_ANALYSIS_BACKEND: AnalysisBackend = "dimx";
export const ANALYSIS_BACKENDS = ["edmkit", "dimx"] as const satisfies readonly AnalysisBackend[];
export const PREFILTER_THRESHOLD_MIN = 0;
export const PREFILTER_THRESHOLD_MAX = 1;

export class SettingsValidationError extends Error {
	readonly issues: SettingsValidationIssue[];

	constructor(issues: readonly SettingsValidationIssue[]) {
		super(issues.map((issue) => issue.message).join(" "));
		this.name = "SettingsValidationError";
		this.issues = [...issues];
	}
}

export function sanitizeSettingsDraft(
	draft: SettingsDraft | ProjectSettings,
	options: SettingsSanitizeOptions = {},
): ProjectSettings {
	const allowedColumns = options.columnNames ? new Set(options.columnNames) : undefined;
	const defaultRanges = options.defaultRanges ?? getDefaultFoldRanges(options.totalPoints ?? 0);
	const targets = sanitizeColumnList(draft.targets, allowedColumns);
	const excludeColumns = sanitizeColumnList(draft.excludeColumns, allowedColumns).filter((name) => !targets.includes(name));
	const totalPoints = options.totalPoints ?? 0;

	return {
		backend: coerceAnalysisBackend(draft.backend),
		targets,
		excludeColumns,
		maxVariables: coercePositiveInteger(draft.maxVariables, DEFAULT_MAX_VARIABLES),
		libraryRange: sanitizeRange(draft.libraryRange, defaultRanges.libraryRange, totalPoints),
		predictionRange: sanitizeRange(draft.predictionRange, defaultRanges.predictionRange, totalPoints),
		holdoutRange: sanitizeRange(draft.holdoutRange, defaultRanges.holdoutRange, totalPoints),
		seed: coerceInteger(draft.seed, DEFAULT_SEED),
		prefilterThreshold: coercePrefilterThreshold(draft.prefilterThreshold),
	};
}

export function validateProjectSettings(
	settings: ProjectSettings,
	options: Pick<SettingsSanitizeOptions, "columnNames" | "totalPoints"> = {},
): SettingsValidationIssue[] {
	const issues: SettingsValidationIssue[] = [];
	const knownColumns = options.columnNames ? new Set(options.columnNames) : undefined;

	if (settings.targets.length === 0) {
		issues.push({ field: "targets", message: "Select at least one target column." });
	}
	if (settings.backend === "dimx" && settings.targets.length !== 1) {
		issues.push({ field: "targets", message: "dimx backend supports exactly one target column." });
	}

	for (const target of settings.targets) {
		if (knownColumns && !knownColumns.has(target)) {
			issues.push({ field: "targets", message: `Unknown target column: ${target}.` });
		}
	}

	for (const excluded of settings.excludeColumns ?? []) {
		if (settings.targets.includes(excluded)) {
			issues.push({ field: "excludeColumns", message: `Target column cannot also be excluded: ${excluded}.` });
		}
		if (knownColumns && !knownColumns.has(excluded)) {
			issues.push({ field: "excludeColumns", message: `Unknown excluded column: ${excluded}.` });
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

	if (settings.libraryRange.end >= settings.predictionRange.start) {
		issues.push({ field: "ranges", message: "Library range must end before the prediction range starts." });
	}
	if (settings.predictionRange.end >= settings.holdoutRange.start) {
		issues.push({ field: "ranges", message: "Prediction range must end before the holdout range starts." });
	}

	return issues;
}

export function isProjectSettingsValid(settings: ProjectSettings, options: SettingsSanitizeOptions = {}): boolean {
	return validateProjectSettings(settings, options).length === 0;
}

function sanitizeColumnList(values: readonly string[] | null | undefined, allowedColumns?: ReadonlySet<string>): string[] {
	if (!values) {
		return [];
	}
	const seen = new Set<string>();
	const result: string[] = [];

	for (const value of values) {
		const name = value.trim();
		if (!name || seen.has(name)) {
			continue;
		}
		if (allowedColumns && !allowedColumns.has(name)) {
			continue;
		}
		seen.add(name);
		result.push(name);
	}

	return result;
}

function sanitizeRange(range: PointRangeDraft | null | undefined, fallback: PointRange, totalPoints: number): PointRange {
	const normalized = toPointRange(readRangeDraft(range), fallback);
	if (totalPoints > 0) {
		return clampPointRange(normalized, totalPoints);
	}
	return normalized;
}

function readRangeDraft(range: PointRangeDraft | null | undefined): PointRange | null {
	if (!range) {
		return null;
	}

	if (Array.isArray(range)) {
		return {
			start: coercePositiveInteger(range[0], 1),
			end: coercePositiveInteger(range[1], 1),
		};
	}

	if ("start" in range) {
		return {
			start: coercePositiveInteger(range.start, 1),
			end: coercePositiveInteger(range.end, 1),
		};
	}

	return null;
}

function validateRange(
	field: "libraryRange" | "predictionRange" | "holdoutRange",
	range: PointRange,
	totalPoints: number | undefined,
	issues: SettingsValidationIssue[],
): void {
	if (!isValidPointRange(range)) {
		issues.push({ field, message: `${field} must be a valid 1-indexed point range.` });
		return;
	}

	if (totalPoints && (range.start > totalPoints || range.end > totalPoints)) {
		issues.push({ field, message: `${field} must be within the dataset point count.` });
	}
}

function coercePositiveInteger(value: number | string | null | undefined, fallback: number): number {
	return Math.max(1, coerceInteger(value, fallback));
}

function coercePrefilterThreshold(value: number | string | null | undefined): number {
	const parsed = coerceFiniteNumber(value, DEFAULT_PREFILTER_THRESHOLD);
	if (parsed < PREFILTER_THRESHOLD_MIN) return PREFILTER_THRESHOLD_MIN;
	if (parsed > PREFILTER_THRESHOLD_MAX) return PREFILTER_THRESHOLD_MAX;
	return parsed;
}

function coerceAnalysisBackend(value: string | null | undefined): AnalysisBackend {
	return value === "dimx" || value === "edmkit" ? value : DEFAULT_ANALYSIS_BACKEND;
}

function coerceFiniteNumber(value: number | string | null | undefined, fallback: number): number {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim()) {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}
	return fallback;
}

function coerceInteger(value: number | string | null | undefined, fallback: number): number {
	if (typeof value === "number" && Number.isFinite(value)) {
		return Math.floor(value);
	}

	if (typeof value === "string" && value.trim()) {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return Math.floor(parsed);
		}
	}

	return fallback;
}
