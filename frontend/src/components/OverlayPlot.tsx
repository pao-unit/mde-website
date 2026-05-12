import * as d3 from "d3";
import { useId } from "react";

interface Series {
	name: string;
	color: string;
	data: number[];
	dashed?: boolean;
}

interface OverlayPlotProps {
	series: Series[];
	xValues?: number[];
	width?: number;
	height?: number;
	marginTop?: number;
	marginRight?: number;
	marginBottom?: number;
	marginLeft?: number;
	xLabel?: string;
	yLabel?: string;
	showPoints?: boolean;
}

interface AxisProps {
	scale: d3.ScaleLinear<number, number>;
	transform: string;
}

function AxisBottom({ scale, transform }: AxisProps) {
	const ticks = scale.ticks();
	const [rangeStart, rangeEnd] = scale.range();
	return (
		<g transform={transform} fill="none" fontSize="10" fontFamily="sans-serif" textAnchor="middle">
			<path stroke="currentColor" d={`M${rangeStart},6V0H${rangeEnd}V6`} />
			{ticks.map((t) => (
				<g key={t} transform={`translate(${scale(t)},0)`}>
					<line stroke="currentColor" y2="6" />
					<text fill="currentColor" y="9" dy="0.71em">
						{t}
					</text>
				</g>
			))}
		</g>
	);
}

function AxisLeft({ scale, transform }: AxisProps) {
	const ticks = scale.ticks();
	const [rangeStart, rangeEnd] = scale.range();
	return (
		<g transform={transform} fill="none" fontSize="10" fontFamily="sans-serif" textAnchor="end">
			<path stroke="currentColor" d={`M-6,${rangeStart}H0V${rangeEnd}H-6`} />
			{ticks.map((t) => (
				<g key={t} transform={`translate(0,${scale(t)})`}>
					<line stroke="currentColor" x2="-6" />
					<text fill="currentColor" x="-9" dy="0.32em">
						{t}
					</text>
				</g>
			))}
		</g>
	);
}

export default function OverlayPlot({
	series,
	xValues,
	width = 640,
	height = 320,
	marginTop = 20,
	marginRight = 24,
	marginBottom = 44,
	marginLeft = 60,
	xLabel,
	yLabel,
	showPoints = false,
}: OverlayPlotProps) {
	const titleId = useId();

	const length = series[0]?.data.length ?? 0;
	const xs = xValues && xValues.length === length ? xValues : Array.from({ length }, (_, i) => i);

	const xDomain: [number, number] = (() => {
		if (xs.length === 0) return [0, 1];
		const min = xs[0] ?? 0;
		const max = xs[xs.length - 1] ?? 1;
		return min === max ? [min, min + 1] : [min, max];
	})();

	const yDomain: [number, number] = (() => {
		let min = Number.POSITIVE_INFINITY;
		let max = Number.NEGATIVE_INFINITY;
		for (const s of series) {
			for (const v of s.data) {
				if (!Number.isFinite(v)) continue;
				if (v < min) min = v;
				if (v > max) max = v;
			}
		}
		if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
		if (min === max) {
			const pad = Math.abs(min) > 0 ? Math.abs(min) * 0.1 : 1;
			return [min - pad, max + pad];
		}
		const pad = (max - min) * 0.05;
		return [min - pad, max + pad];
	})();

	const x = d3.scaleLinear(xDomain, [marginLeft, width - marginRight]);
	const y = d3.scaleLinear(yDomain, [height - marginBottom, marginTop]);

	const lineFor = (data: number[]) =>
		d3.line<number>(
			(_, i) => x(xs[i] ?? i),
			(v) => y(v),
		)(data) ?? undefined;

	return (
		<svg width={width} height={height} role="img" aria-labelledby={titleId}>
			<title id={titleId}>{`${yLabel ?? "value"} vs ${xLabel ?? "x"}`}</title>
			<AxisBottom scale={x} transform={`translate(0,${height - marginBottom})`} />
			<AxisLeft scale={y} transform={`translate(${marginLeft},0)`} />
			{xLabel ? (
				<text x={(marginLeft + width - marginRight) / 2} y={height - 8} textAnchor="middle" fontSize="12" fill="currentColor">
					{xLabel}
				</text>
			) : null}
			{yLabel ? (
				<text
					transform={`translate(14,${(marginTop + height - marginBottom) / 2}) rotate(-90)`}
					textAnchor="middle"
					fontSize="12"
					fill="currentColor"
				>
					{yLabel}
				</text>
			) : null}
			{series.map((s) => (
				<g key={s.name}>
					<path
						fill="none"
						stroke={s.color}
						strokeWidth="1.5"
						strokeDasharray={s.dashed ? "4 3" : undefined}
						d={lineFor(s.data)}
					/>
					{showPoints
						? s.data.map((v, i) => (
								<circle
									// biome-ignore lint/suspicious/noArrayIndexKey: dense fixed index
									key={i}
									cx={x(xs[i] ?? i)}
									cy={y(v)}
									r="2.5"
									fill="white"
									stroke={s.color}
									strokeWidth="1.5"
								/>
							))
						: null}
				</g>
			))}
			<g transform={`translate(${marginLeft + 8},${marginTop + 4})`}>
				{series.map((s, i) => (
					<g key={s.name} transform={`translate(0,${i * 16})`}>
						<line x1="0" x2="18" y1="6" y2="6" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? "4 3" : undefined} />
						<text x="24" y="10" fontSize="11" fill="currentColor">
							{s.name}
						</text>
					</g>
				))}
			</g>
		</svg>
	);
}
