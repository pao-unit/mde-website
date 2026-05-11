export type PointRange = {
	start: number;
	end: number;
};

export type PointRangeTuple = readonly [number, number];
export type PointRangeInput = PointRange | PointRangeTuple;

export type FoldRanges = {
	libraryRange: PointRange;
	predictionRange: PointRange;
	holdoutRange: PointRange;
};

export const DEFAULT_POINT_RANGE: PointRange = { start: 1, end: 1 };

export function createPointRange(start: number, end: number): PointRange {
	return {
		start: normalizePoint(start),
		end: normalizePoint(end),
	};
}

export function toPointRange(range: PointRangeInput | null | undefined, fallback: PointRange = DEFAULT_POINT_RANGE): PointRange {
	if (!range) {
		return { ...fallback };
	}

	if ("start" in range) {
		return createPointRange(range.start, range.end);
	}

	return createPointRange(range[0], range[1]);
}

export function toPointRangeTuple(range: PointRange): [number, number] {
	return [range.start, range.end];
}

export function isValidPointRange(range: PointRange): boolean {
	return Number.isInteger(range.start) && Number.isInteger(range.end) && range.start >= 1 && range.end >= range.start;
}

export function getPointRangeSize(range: PointRange): number {
	if (!isValidPointRange(range)) {
		return 0;
	}
	return range.end - range.start + 1;
}

export function clampPointRange(range: PointRange, totalPoints: number): PointRange {
	if (!Number.isFinite(totalPoints) || totalPoints <= 0) {
		return { ...DEFAULT_POINT_RANGE };
	}

	const maxPoint = Math.max(1, Math.floor(totalPoints));
	const start = clamp(range.start, 1, maxPoint);
	const end = clamp(Math.max(range.end, start), start, maxPoint);
	return { start, end };
}

export function getDefaultFoldRanges(totalPoints: number): FoldRanges {
	const pointCount = Math.max(0, Math.floor(Number.isFinite(totalPoints) ? totalPoints : 0));
	if (pointCount <= 1) {
		return {
			libraryRange: { ...DEFAULT_POINT_RANGE },
			predictionRange: { ...DEFAULT_POINT_RANGE },
			holdoutRange: { ...DEFAULT_POINT_RANGE },
		};
	}

	const libraryEnd = clamp(Math.round(pointCount * 0.6), 1, pointCount);
	const predictionStart = clamp(libraryEnd + 1, 1, pointCount);
	const predictionEnd = clamp(Math.max(predictionStart, Math.round(pointCount * 0.8)), predictionStart, pointCount);
	const holdoutStart = clamp(predictionEnd + 1, 1, pointCount);

	return {
		libraryRange: { start: 1, end: libraryEnd },
		predictionRange: { start: predictionStart, end: predictionEnd },
		holdoutRange: { start: holdoutStart, end: pointCount },
	};
}

function normalizePoint(value: number): number {
	if (!Number.isFinite(value)) {
		return 1;
	}
	return Math.max(1, Math.floor(value));
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
