import * as d3 from "d3";
import { useEffect, useRef } from "react";

interface Props {
	data: number[];
	width?: number;
	height?: number;
	marginTop?: number;
	marginRight?: number;
	marginBottom?: number;
	marginLeft?: number;
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
	const gx = useRef<SVGGElement>(null);
	const gy = useRef<SVGGElement>(null);

	const domainX = [0, data.length - 1];
	const x = d3.scaleLinear(domainX, [marginLeft, width - marginRight]);
	const domainY = d3.extent(data);
	const y = d3.scaleLinear([domainY[0] ?? 0, domainY[1] ?? 1], [height - marginBottom, marginTop]);

	const line = d3.line((_, i) => x(i), y);
	useEffect(() => {
		if (!gx.current) return;
		void d3.select(gx.current).call(d3.axisBottom(x));
	}, [x]);
	useEffect(() => {
		if (!gy.current) return;
		void d3.select(gy.current).call(d3.axisLeft(y));
	}, [y]);

	return (
		<svg width={width} height={height}>
			<title>Line Plot</title>
			<g ref={gx} transform={`translate(0,${height - marginBottom})`} />
			<g ref={gy} transform={`translate(${marginLeft},0)`} />
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
