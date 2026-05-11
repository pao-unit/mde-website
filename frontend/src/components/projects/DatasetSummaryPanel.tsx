import { Box, FormatNumber, Stack, Table, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import type { ColumnSummary, DatasetOverview } from "./types.ts";

interface DatasetSummaryPanelProps {
	dataset?: DatasetOverview;
	columns: ColumnSummary[];
	selectedVariable: string | null;
	onSelectVariable: (column: string) => void;
	isLoading: boolean;
	error?: string | null;
}

const formatNumber = (value: number | null | undefined): ReactNode => {
	if (value == null || Number.isNaN(value)) {
		return "-";
	}

	const rounded = Math.round(value * 1000) / 1000;
	const isInteger = Number.isInteger(rounded);

	return <FormatNumber value={rounded} minimumFractionDigits={isInteger ? 0 : 3} maximumFractionDigits={isInteger ? 0 : 3} />;
};

export function DatasetSummaryPanel({
	dataset,
	columns,
	selectedVariable,
	onSelectVariable,
	isLoading,
	error,
}: DatasetSummaryPanelProps) {
	const pointCount = dataset?.pointCount ?? 0;

	return (
		<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
			<Stack gap={5}>
				<Stack gap={1}>
					<Text fontSize="sm" fontWeight="semibold" textTransform="uppercase" color="fg.muted">
						Dataset
					</Text>
					<Text as="h3" fontSize="lg" fontWeight="semibold">
						Variables
					</Text>
					<Text color="fg.muted">
						Click a row to preview the raw time series. Statistics are calculated from the uploaded dataset.
					</Text>
				</Stack>

				{isLoading ? (
					<Text color="fg.muted">Loading dataset summary…</Text>
				) : error ? (
					<Text color="fg.muted">{error}</Text>
				) : (
					<Stack gap={4}>
						<Stack direction="row" justify="space-between" color="fg.muted" fontSize="sm">
							<Text>Total variables: {columns.length}</Text>
							<Text>Points: {pointCount}</Text>
						</Stack>
						<Table.ScrollArea borderWidth="1px" borderColor="gray.100" borderRadius="lg" maxH="420px">
							<Table.Root size="sm" stickyHeader variant="line">
								<Table.Header>
									<Table.Row bg="gray.50" boxShadow="sm">
										<Table.ColumnHeader>Name</Table.ColumnHeader>
										<Table.ColumnHeader textAlign="end">Missing</Table.ColumnHeader>
										<Table.ColumnHeader textAlign="end">Mean</Table.ColumnHeader>
										<Table.ColumnHeader textAlign="end">Std</Table.ColumnHeader>
										<Table.ColumnHeader textAlign="end">Min</Table.ColumnHeader>
										<Table.ColumnHeader textAlign="end">Max</Table.ColumnHeader>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{columns.map((column) => {
										const isSelected = column.name === selectedVariable;
										return (
											<Table.Row
												key={column.name}
												bg={isSelected ? "blue.50" : undefined}
												_hover={{ bg: isSelected ? "blue.100" : "gray.50" }}
												onClick={() => onSelectVariable(column.name)}
												cursor="pointer"
											>
												<Table.Cell>
													<Text fontWeight="medium" color="fg">
														{column.name}
													</Text>
													<Text fontSize="xs" color="fg.muted">
														{column.dtype}
													</Text>
												</Table.Cell>
												<Table.Cell textAlign="end">{column.missing}</Table.Cell>
												<Table.Cell textAlign="end">{formatNumber(column.mean)}</Table.Cell>
												<Table.Cell textAlign="end">{formatNumber(column.std)}</Table.Cell>
												<Table.Cell textAlign="end">{formatNumber(column.min)}</Table.Cell>
												<Table.Cell textAlign="end">{formatNumber(column.max)}</Table.Cell>
											</Table.Row>
										);
									})}
								</Table.Body>
							</Table.Root>
						</Table.ScrollArea>
					</Stack>
				)}
			</Stack>
		</Box>
	);
}
