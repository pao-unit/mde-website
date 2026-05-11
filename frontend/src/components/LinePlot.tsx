import * as d3 from "d3";

interface Props {
	data: number[];
	width?: number;
	height?: number;
	marginTop?: number;
	marginRight?: number;
	marginBottom?: number;
	marginLeft?: number;
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

export default function LinePlot({
	data,
	width = 640,
	height = 400,
	marginTop = 20,
	marginRight = 20,
	marginBottom = 30,
	marginLeft = 60,
}: Props) {
	const domainX = [0, data.length - 1];
	const x = d3.scaleLinear(domainX, [marginLeft, width - marginRight]);
	const domainY = d3.extent(data);
	const y = d3.scaleLinear([domainY[0] ?? 0, domainY[1] ?? 1], [height - marginBottom, marginTop]);

	const line = d3.line((_, i) => x(i), y);

	return (
		<svg width={width} height={height}>
			<title>Line Plot</title>
			<AxisBottom scale={x} transform={`translate(0,${height - marginBottom})`} />
			<AxisLeft scale={y} transform={`translate(${marginLeft},0)`} />
			<path fill="none" stroke="currentColor" strokeWidth="1.5" d={line(data) ?? undefined} />
			<g fill="white" stroke="currentColor" strokeWidth="1.5">
				{data.map((d, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: this is fine
					<circle key={i} cx={x(i)} cy={y(d)} r="2.5" />
				))}
			</g>
		</svg>
	);
}
