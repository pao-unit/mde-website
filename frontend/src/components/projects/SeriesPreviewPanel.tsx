import { Box, Stack, Text } from "@chakra-ui/react";
import LinePlot from "../LinePlot.tsx";

interface SeriesPreviewPanelProps {
	variable: string | null;
	isLoading: boolean;
	error?: string | null;
	data: number[] | null;
}

export function SeriesPreviewPanel({ variable, isLoading, error, data }: SeriesPreviewPanelProps) {
	return (
		<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
			<Stack gap={4}>
				<Stack gap={1}>
					<Text as="h3" fontSize="lg" fontWeight="semibold">
						Time series preview
					</Text>
					<Text color="fg.muted">Inspect the raw values for the currently selected variable before launching the run.</Text>
				</Stack>
				{renderContent(variable, isLoading, error, data)}
			</Stack>
		</Box>
	);
}

function renderContent(variable: string | null, isLoading: boolean, error: string | null | undefined, data: number[] | null) {
	if (!variable) {
		return <Text color="fg.muted">Select a variable to preview its time series.</Text>;
	}

	if (isLoading) {
		return <Text color="fg.muted">Loading {variable}…</Text>;
	}

	if (error) {
		return <Text color="fg.muted">{error}</Text>;
	}

	if (!data || data.length === 0) {
		return <Text color="fg.muted">No data available for the selected variable.</Text>;
	}

	return <LinePlot data={data} width={720} height={340} />;
}
