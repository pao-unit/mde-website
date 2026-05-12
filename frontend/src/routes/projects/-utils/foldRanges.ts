import type { components } from "../../../libs/api/openapi.gen.ts";

export type PointRange = components["schemas"]["PointRange"];

export type FoldRanges = {
	libraryRange: PointRange;
	predictionRange: PointRange;
	holdoutRange: PointRange;
};

export type FoldBoundary =
	| "library.start"
	| "library.end"
	| "prediction.start"
	| "prediction.end"
	| "holdout.start"
	| "holdout.end";

export type PointRangeDraft =
	| PointRange
	| readonly [number | string | null | undefined, number | string | null | undefined]
	| {
			start?: number | string | null;
			end?: number | string | null;
	  };

const DEFAULT_POINT_RANGE: PointRange = { start: 1, end: 1 };

export function getDefaultFoldRanges(totalPoints: number): FoldRanges {
	const pointCount = Math.max(0, Math.floor(Number.isFinite(totalPoints) ? totalPoints : 0));
	if (pointCount < 3) {
		return {
			libraryRange: { ...DEFAULT_POINT_RANGE },
			predictionRange: { ...DEFAULT_POINT_RANGE },
			holdoutRange: { ...DEFAULT_POINT_RANGE },
		};
	}

	const libraryEnd = clamp(Math.round(pointCount * 0.6), 1, pointCount - 2);
	const predictionStart = libraryEnd + 1;
	const predictionEnd = clamp(Math.round(pointCount * 0.8), predictionStart, pointCount - 1);
	const holdoutStart = predictionEnd + 1;

	return {
		libraryRange: { start: 1, end: libraryEnd },
		predictionRange: { start: predictionStart, end: predictionEnd },
		holdoutRange: { start: holdoutStart, end: pointCount },
	};
}

export function sanitizeFoldRanges(
	ranges: Partial<Record<keyof FoldRanges, PointRangeDraft | null | undefined>>,
	options: { totalPoints?: number; defaultRanges?: FoldRanges } = {},
): FoldRanges {
	const totalPoints = normalizeTotalPoints(options.totalPoints);
	const defaultRanges = options.defaultRanges ?? getDefaultFoldRanges(totalPoints);
	const sanitized = {
		libraryRange: sanitizeRange(ranges.libraryRange, defaultRanges.libraryRange, totalPoints),
		predictionRange: sanitizeRange(ranges.predictionRange, defaultRanges.predictionRange, totalPoints),
		holdoutRange: sanitizeRange(ranges.holdoutRange, defaultRanges.holdoutRange, totalPoints),
	};

	if (areFoldRangesOrdered(sanitized)) {
		return sanitized;
	}

	return {
		libraryRange: { ...defaultRanges.libraryRange },
		predictionRange: { ...defaultRanges.predictionRange },
		holdoutRange: { ...defaultRanges.holdoutRange },
	};
}

export function moveFoldBoundary(
	ranges: FoldRanges,
	boundary: FoldBoundary,
	value: number,
	options: { totalPoints?: number } = {},
): FoldRanges {
	const next = cloneFoldRanges(ranges);
	const point = normalizePoint(value);
	const maxPoint = normalizeTotalPoints(options.totalPoints);

	switch (boundary) {
		case "library.start":
			next.libraryRange.start = clamp(point, 1, next.libraryRange.end);
			break;
		case "library.end":
			next.libraryRange.end = clamp(point, next.libraryRange.start, next.predictionRange.start - 1);
			break;
		case "prediction.start":
			next.predictionRange.start = clamp(point, next.libraryRange.end + 1, next.predictionRange.end);
			break;
		case "prediction.end":
			next.predictionRange.end = clamp(point, next.predictionRange.start, next.holdoutRange.start - 1);
			break;
		case "holdout.start":
			next.holdoutRange.start = clamp(point, next.predictionRange.end + 1, next.holdoutRange.end);
			break;
		case "holdout.end":
			next.holdoutRange.end = clamp(point, next.holdoutRange.start, maxPoint || Number.MAX_SAFE_INTEGER);
			break;
	}

	return next;
}

export function isValidPointRange(range: PointRange, totalPoints?: number): boolean {
	const maxPoint = normalizeTotalPoints(totalPoints);
	const withinDataset = maxPoint === 0 || range.end <= maxPoint;
	return (
		Number.isInteger(range.start) && Number.isInteger(range.end) && range.start >= 1 && range.end >= range.start && withinDataset
	);
}

export function areFoldRangesOrdered(ranges: FoldRanges): boolean {
	return ranges.libraryRange.end < ranges.predictionRange.start && ranges.predictionRange.end < ranges.holdoutRange.start;
}

function sanitizeRange(range: PointRangeDraft | null | undefined, fallback: PointRange, totalPoints: number): PointRange {
	const normalized = readRangeDraft(range) ?? fallback;
	const start = normalizePoint(normalized.start);
	const end = Math.max(start, normalizePoint(normalized.end));
	const maxPoint = totalPoints || Number.MAX_SAFE_INTEGER;

	return {
		start: clamp(start, 1, maxPoint),
		end: clamp(end, 1, maxPoint),
	};
}

function readRangeDraft(range: PointRangeDraft | null | undefined): PointRange | null {
	if (!range) return null;

	if (Array.isArray(range)) {
		return {
			start: coerceNumber(range[0], 1),
			end: coerceNumber(range[1], 1),
		};
	}

	if ("start" in range) {
		return {
			start: coerceNumber(range.start, 1),
			end: coerceNumber(range.end, 1),
		};
	}

	return null;
}

function cloneFoldRanges(ranges: FoldRanges): FoldRanges {
	return {
		libraryRange: { ...ranges.libraryRange },
		predictionRange: { ...ranges.predictionRange },
		holdoutRange: { ...ranges.holdoutRange },
	};
}

function normalizePoint(value: number): number {
	return Math.max(1, Math.floor(Number.isFinite(value) ? value : 1));
}

function normalizeTotalPoints(value: number | undefined): number {
	if (!Number.isFinite(value) || value === undefined) return 0;
	return Math.max(0, Math.floor(value));
}

function coerceNumber(value: number | string | null | undefined, fallback: number): number {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim()) {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return fallback;
}

function clamp(value: number, min: number, max: number): number {
	if (max < min) return min;
	return Math.min(Math.max(value, min), max);
}
