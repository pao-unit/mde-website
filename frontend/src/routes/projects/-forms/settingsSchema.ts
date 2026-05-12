import * as v from "valibot";
import { getDefaultFoldRanges } from "../-utils/foldRanges.ts";
import type { AnalysisBackend, PointRange, ProjectSettings } from "../-utils/model.ts";
import {
	ANALYSIS_BACKENDS,
	DEFAULT_ANALYSIS_BACKEND,
	DEFAULT_MAX_VARIABLES,
	DEFAULT_PREFILTER_THRESHOLD,
	DEFAULT_SEED,
	PREFILTER_THRESHOLD_MAX,
	PREFILTER_THRESHOLD_MIN,
	type SettingsOptions,
} from "../-utils/settings.ts";

const typeDefaults = getDefaultFoldRanges(3);

type AnalysisSettingsFormValues = Omit<ProjectSettings, "backend" | "excludeColumns"> & {
	backend: AnalysisBackend;
	excludeColumns: string[];
};

export const SETTINGS_FORM_DEFAULT_VALUES: ProjectSettings = {
	backend: DEFAULT_ANALYSIS_BACKEND,
	targets: [],
	excludeColumns: [],
	maxVariables: DEFAULT_MAX_VARIABLES,
	libraryRange: typeDefaults.libraryRange,
	predictionRange: typeDefaults.predictionRange,
	holdoutRange: typeDefaults.holdoutRange,
	seed: DEFAULT_SEED,
	prefilterThreshold: DEFAULT_PREFILTER_THRESHOLD,
};

export function createAnalysisSettingsSchema(options: Pick<SettingsOptions, "columnNames" | "totalPoints"> = {}) {
	const knownColumns = options.columnNames ? new Set(options.columnNames) : null;
	const totalPoints = normalizeTotalPoints(options.totalPoints);
	const pointRangeSchema = createPointRangeSchema(totalPoints);
	const columnNameSchema = createColumnNameSchema(knownColumns);

	return v.pipe(
		v.object({
			backend: v.picklist(ANALYSIS_BACKENDS, "Choose a supported analysis backend."),
			targets: v.pipe(
				v.array(columnNameSchema),
				v.minLength(1, "Select at least one target column."),
				v.check((values) => hasUniqueValues(values), "Choose each column only once."),
			),
			excludeColumns: v.pipe(
				v.array(columnNameSchema),
				v.check((values) => hasUniqueValues(values), "Choose each column only once."),
			),
			maxVariables: v.pipe(
				v.number("Enter the maximum variable count."),
				v.finite("Enter a finite maximum variable count."),
				v.integer("Maximum variables must be an integer."),
				v.minValue(1, "Maximum variables must be at least 1."),
			),
			libraryRange: pointRangeSchema,
			predictionRange: pointRangeSchema,
			holdoutRange: pointRangeSchema,
			seed: v.pipe(
				v.number("Enter a random seed."),
				v.finite("Enter a finite random seed."),
				v.integer("Seed must be an integer."),
			),
			prefilterThreshold: v.pipe(
				v.number("Enter a pre-filter threshold."),
				v.finite("Enter a finite pre-filter threshold."),
				v.minValue(PREFILTER_THRESHOLD_MIN, `Pre-filter threshold must be at least ${PREFILTER_THRESHOLD_MIN}.`),
				v.maxValue(PREFILTER_THRESHOLD_MAX, `Pre-filter threshold must be at most ${PREFILTER_THRESHOLD_MAX}.`),
			),
		}),
		v.forward(
			v.check(
				(settings: AnalysisSettingsFormValues) => settings.backend !== "dimx" || settings.targets.length === 1,
				"dimx backend supports exactly one target column.",
			),
			["targets"],
		),
		v.forward(
			v.check(
				(settings: AnalysisSettingsFormValues) => settings.targets.every((target) => !settings.excludeColumns.includes(target)),
				"Target columns cannot also be excluded.",
			),
			["excludeColumns"],
		),
		v.forward(
			v.check(
				(settings: AnalysisSettingsFormValues) => settings.libraryRange.end < settings.predictionRange.start,
				"Library range must end before the prediction range starts.",
			),
			["libraryRange"],
		),
		v.forward(
			v.check(
				(settings: AnalysisSettingsFormValues) => settings.predictionRange.end < settings.holdoutRange.start,
				"Prediction range must end before the holdout range starts.",
			),
			["predictionRange"],
		),
	);
}

function createPointRangeSchema(totalPoints: number) {
	const pointSchema = v.pipe(
		v.number("Enter a point index."),
		v.finite("Enter a finite point index."),
		v.integer("Point index must be an integer."),
		v.minValue(1, "Point index must be at least 1."),
	);

	return v.pipe(
		v.object({
			start: pointSchema,
			end: pointSchema,
		}),
		v.forward(
			v.check((range: PointRange) => range.end >= range.start, "Range end must be greater than or equal to start."),
			["end"],
		),
		v.forward(
			v.check((range: PointRange) => totalPoints === 0 || range.end <= totalPoints, "Range end must stay inside the dataset."),
			["end"],
		),
	);
}

function createColumnNameSchema(knownColumns: ReadonlySet<string> | null) {
	return v.pipe(
		v.string("Column name is required."),
		v.nonEmpty("Column name is required."),
		v.check((column) => !knownColumns || knownColumns.has(column), "Choose a column from this dataset."),
	);
}

function normalizeTotalPoints(value: number | undefined): number {
	return Number.isFinite(value) && value !== undefined ? Math.max(0, Math.floor(value)) : 0;
}

function hasUniqueValues(values: readonly string[]): boolean {
	return new Set(values).size === values.length;
}
