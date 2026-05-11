import { Box, Stack, Text } from "@chakra-ui/react";
import OverlayPlot from "../OverlayPlot.tsx";
import type { ProjectResult } from "./types.ts";

interface ResultPlotPanelProps {
	result: ProjectResult;
}

export function ResultPlotPanel({ result }: ResultPlotPanelProps) {
	const steps = result.steps;

	if (steps.length === 0) {
		return (
			<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
				<Stack gap={2}>
					<Text as="h3" fontSize="lg" fontWeight="semibold">
						Prediction skill (rho)
					</Text>
					<Text color="fg.muted">No variables were selected.</Text>
				</Stack>
			</Box>
		);
	}

	const stepIndices = steps.map((_, i) => i + 1);
	const innerSeries = {
		name: "Training (prediction) rho",
		color: "#0EA5E9",
		data: steps.map((s) => s.rhoPrediction),
		dashed: true,
	};
	const outerSeries = {
		name: "Holdout rho",
		color: "#1E3A8A",
		data: steps.map((s) => s.rhoHoldout),
	};

	const width = Math.max(640, steps.length * 64);

	return (
		<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
			<Stack gap={4}>
				<Text as="h3" fontSize="lg" fontWeight="semibold">
					Prediction skill across greedy steps
				</Text>
				<Text color="fg.muted">
					Prediction-range rho drives variable selection; holdout-range rho measures generalisation on the held-out window.
				</Text>
				<Box overflowX="auto">
					<OverlayPlot
						series={[innerSeries, outerSeries]}
						xValues={stepIndices}
						width={width}
						height={320}
						xLabel="Greedy step"
						yLabel="rho"
						showPoints
					/>
				</Box>
			</Stack>
		</Box>
	);
}
