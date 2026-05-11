import { Box, Stack, Text } from "@chakra-ui/react";
import OverlayPlot from "../OverlayPlot.tsx";
import type { BestStep, ProjectSettings } from "./types.ts";

interface BestStepPlotPanelProps {
	bestStep: BestStep | null | undefined;
	settings: ProjectSettings;
}

export function BestStepPlotPanel({ bestStep, settings }: BestStepPlotPanelProps) {
	if (!bestStep) {
		return (
			<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
				<Stack gap={2}>
					<Text as="h3" fontSize="lg" fontWeight="semibold">
						Best step — actual vs predicted
					</Text>
					<Text color="fg.muted">No variables were selected.</Text>
				</Stack>
			</Box>
		);
	}

	const holdoutStart = settings.holdoutRange.start;

	return (
		<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
			<Stack gap={4}>
				<Stack gap={1}>
					<Text as="h3" fontSize="lg" fontWeight="semibold">
						Best step — actual vs predicted
					</Text>
					<Text color="fg.muted">
						Step {bestStep.stepIndex} achieved the highest holdout rho ({bestStep.rho.toFixed(3)}). Predictions are evaluated on
						the Holdout range using the Training (library) range as the simplex library.
					</Text>
				</Stack>
				<Stack gap={6}>
					{bestStep.plots.map((plot) => {
						const xs = plot.observed.map((_, i) => holdoutStart + i);
						return (
							<Box key={plot.name}>
								<Text fontWeight="medium" mb={2}>
									{plot.name}
								</Text>
								<Box overflowX="auto">
									<OverlayPlot
										series={[
											{ name: "Observed", color: "#0F172A", data: plot.observed },
											{ name: "Predicted", color: "#DC2626", data: plot.predicted, dashed: true },
										]}
										xValues={xs}
										width={Math.max(640, Math.min(plot.observed.length * 1.5, 1200))}
										height={280}
										xLabel="Point index"
										yLabel={plot.name}
									/>
								</Box>
							</Box>
						);
					})}
				</Stack>
			</Stack>
		</Box>
	);
}
