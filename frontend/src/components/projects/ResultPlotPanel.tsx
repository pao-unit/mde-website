import { Box, Stack, Text } from "@chakra-ui/react";
import LinePlot from "../LinePlot.tsx";
import type { ProjectResult } from "./types.ts";

interface ResultPlotPanelProps {
	result: ProjectResult;
}

export function ResultPlotPanel({ result }: ResultPlotPanelProps) {
	const entries = Object.entries(result);

	if (entries.length === 0) {
		return (
			<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
				<Stack gap={2}>
					<Text as="h3" fontSize="lg" fontWeight="semibold">
						Cross mapping (rho)
					</Text>
					<Text color="fg.muted">No result entries available yet.</Text>
				</Stack>
			</Box>
		);
	}

	return (
		<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
			<Stack gap={4}>
				<Text as="h3" fontSize="lg" fontWeight="semibold">
					Cross mapping (rho)
				</Text>
				<Text color="fg.muted">Change of cross mapping skill over additional dimensions.</Text>
				<Box overflowX="auto">
					<LinePlot data={entries.map(([, value]) => value)} width={Math.max(640, entries.length * 32)} height={320} />
				</Box>
			</Stack>
		</Box>
	);
}
