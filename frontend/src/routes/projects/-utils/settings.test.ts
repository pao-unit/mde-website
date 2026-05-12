import { describe, expect, it } from "vitest";
import { getDefaultFoldRanges, moveFoldBoundary } from "./foldRanges.ts";
import {
	assignVariableRole,
	DEFAULT_ANALYSIS_BACKEND,
	initSettings,
	sanitizeSettings,
	setBackend,
	validateSettings,
	type ProjectSettings,
} from "./settings.ts";

const columns = ["target_a", "target_b", "candidate_a", "candidate_b"];

describe("settings pure functions", () => {
	it("uses the OpenAPI backend default when sanitizing settings", () => {
		const settings = sanitizeSettings({}, { columnNames: columns, totalPoints: 10 });

		expect(DEFAULT_ANALYSIS_BACKEND).toBe("edmkit");
		expect(settings.backend).toBe("edmkit");
		expect(settings.libraryRange).toEqual({ start: 1, end: 6 });
		expect(settings.predictionRange).toEqual({ start: 7, end: 8 });
		expect(settings.holdoutRange).toEqual({ start: 9, end: 10 });
	});

	it("initializes a target from the first available column", () => {
		const settings = initSettings(null, { columnNames: columns, totalPoints: 10 });

		expect(settings.targets).toEqual(["target_a"]);
		expect(validateSettings(settings, { columnNames: columns, totalPoints: 10 })).toEqual([]);
	});

	it("sanitizes column lists and keeps target and excluded roles mutually exclusive", () => {
		const settings = sanitizeSettings(
			{
				targets: [" target_a ", "unknown", "target_a"],
				excludeColumns: ["target_a", "candidate_a", "candidate_a", "unknown"],
			},
			{ columnNames: columns, totalPoints: 10 },
		);

		expect(settings.targets).toEqual(["target_a"]);
		expect(settings.excludeColumns).toEqual(["candidate_a"]);
	});

	it("assigns variable roles without allowing target and excluded overlap", () => {
		const settings = initSettings(null, { columnNames: columns, totalPoints: 10 });
		const withExcluded = assignVariableRole(settings, "target_a", "excluded");
		const withTarget = assignVariableRole(withExcluded, "target_a", "target");
		const withCandidate = assignVariableRole(withTarget, "target_a", "candidate");

		expect(withExcluded.targets).toEqual([]);
		expect(withExcluded.excludeColumns).toEqual(["target_a"]);
		expect(withTarget.targets).toEqual(["target_a"]);
		expect(withTarget.excludeColumns).toEqual([]);
		expect(withCandidate.targets).toEqual([]);
		expect(withCandidate.excludeColumns).toEqual([]);
	});

	it("limits dimx to exactly one target during updates", () => {
		const settings = sanitizeSettings(
			{
				backend: "edmkit",
				targets: ["target_a", "target_b"],
				excludeColumns: ["candidate_a"],
			},
			{ columnNames: columns, totalPoints: 10 },
		);

		const dimx = setBackend(settings, "dimx");
		const retargeted = assignVariableRole(dimx, "target_b", "target");

		expect(dimx.targets).toEqual(["target_a"]);
		expect(retargeted.targets).toEqual(["target_b"]);
		expect(validateSettings(retargeted, { columnNames: columns, totalPoints: 10 })).toEqual([]);
	});

	it("validates dimx target cardinality and inclusive fold ordering", () => {
		const invalid: ProjectSettings = {
			backend: "dimx",
			targets: ["target_a", "target_b"],
			excludeColumns: ["target_a"],
			maxVariables: 0,
			libraryRange: { start: 1, end: 7 },
			predictionRange: { start: 7, end: 8 },
			holdoutRange: { start: 8, end: 10 },
			seed: 0.5,
			prefilterThreshold: 1.5,
		};

		const fields = validateSettings(invalid, { columnNames: columns, totalPoints: 10 }).map((issue) => issue.field);

		expect(fields).toContain("targets");
		expect(fields).toContain("excludeColumns");
		expect(fields).toContain("maxVariables");
		expect(fields).toContain("seed");
		expect(fields).toContain("prefilterThreshold");
		expect(fields.filter((field) => field === "ranges")).toHaveLength(2);
	});
});

describe("fold range pure functions", () => {
	it("creates ordered 1-index inclusive default fold ranges", () => {
		expect(getDefaultFoldRanges(5)).toEqual({
			libraryRange: { start: 1, end: 3 },
			predictionRange: { start: 4, end: 4 },
			holdoutRange: { start: 5, end: 5 },
		});
	});

	it("clamps moved boundaries to the same constraints used by validation", () => {
		const ranges = getDefaultFoldRanges(10);

		expect(moveFoldBoundary(ranges, "library.end", 9, { totalPoints: 10 })).toMatchObject({
			libraryRange: { start: 1, end: 6 },
			predictionRange: { start: 7, end: 8 },
		});
		expect(moveFoldBoundary(ranges, "prediction.start", 1, { totalPoints: 10 })).toMatchObject({
			libraryRange: { start: 1, end: 6 },
			predictionRange: { start: 7, end: 8 },
		});
		expect(moveFoldBoundary(ranges, "prediction.end", 10, { totalPoints: 10 })).toMatchObject({
			predictionRange: { start: 7, end: 8 },
			holdoutRange: { start: 9, end: 10 },
		});
		expect(moveFoldBoundary(ranges, "holdout.start", 1, { totalPoints: 10 })).toMatchObject({
			predictionRange: { start: 7, end: 8 },
			holdoutRange: { start: 9, end: 10 },
		});
	});
});
