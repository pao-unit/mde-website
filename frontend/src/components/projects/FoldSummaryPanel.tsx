import { Box, DataList, Stack, Text } from "@chakra-ui/react";
import type { FoldSummary } from "./types.ts";

interface FoldSummaryPanelProps {
	fold: FoldSummary;
}

export function FoldSummaryPanel({ fold }: FoldSummaryPanelProps) {
	return (
		<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
			<Stack gap={3}>
				<Text as="h3" fontSize="md" fontWeight="semibold">
					Fold layout
				</Text>
				<Text fontSize="sm" color="fg.muted">
					Library serves as the simplex library throughout. Prediction is the held-out target during greedy variable selection.
					Holdout is the final out-of-sample test.
				</Text>
				<DataList.Root size="sm" colorPalette="gray">
					<DataList.Item>
						<DataList.ItemLabel>Training (library) points</DataList.ItemLabel>
						<DataList.ItemValue>{fold.librarySize.toLocaleString()}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Training (prediction) points</DataList.ItemLabel>
						<DataList.ItemValue>{fold.predictionSize.toLocaleString()}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Holdout points</DataList.ItemLabel>
						<DataList.ItemValue>{fold.holdoutSize.toLocaleString()}</DataList.ItemValue>
					</DataList.Item>
				</DataList.Root>
			</Stack>
		</Box>
	);
}
