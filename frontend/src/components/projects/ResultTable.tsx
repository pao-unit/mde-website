import { Badge, Box, FormatNumber, Stack, Table, Text } from "@chakra-ui/react";
import type { ProjectResult } from "./types.ts";

interface ResultTableProps {
	result: ProjectResult;
}

export function ResultTable({ result }: ResultTableProps) {
	const steps = result.steps;
	const bestIndex = result.bestStep?.stepIndex;

	if (steps.length === 0) {
		return (
			<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
				<Text color="fg.muted">No variables were selected.</Text>
			</Box>
		);
	}

	return (
		<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
			<Stack gap={4}>
				<Text as="h3" fontSize="lg" fontWeight="semibold">
					Selected variables
				</Text>
				<Text color="fg.muted" fontSize="sm">
					Variables in the order they were chosen. Prediction rho drove selection; holdout rho measures generalisation on the
					out-of-sample holdout range.
				</Text>
				<Table.ScrollArea borderWidth="1px" borderColor="gray.100" borderRadius="lg" maxH="480px">
					<Table.Root size="sm" stickyHeader variant="line">
						<Table.Header>
							<Table.Row bg="gray.50" boxShadow="sm">
								<Table.ColumnHeader>Step</Table.ColumnHeader>
								<Table.ColumnHeader>Variable</Table.ColumnHeader>
								<Table.ColumnHeader textAlign="end">rho (prediction)</Table.ColumnHeader>
								<Table.ColumnHeader textAlign="end">rho (holdout)</Table.ColumnHeader>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{steps.map((step, index) => {
								const stepNumber = index + 1;
								const isBest = bestNumber(bestIndex) === stepNumber;
								return (
									<Table.Row key={`${index}-${step.variable}`} bg={isBest ? "blue.50" : undefined}>
										<Table.Cell>
											<Stack direction="row" gap={2} align="center">
												<Text>{stepNumber}</Text>
												{isBest ? (
													<Badge colorPalette="blue" size="xs">
														best
													</Badge>
												) : null}
											</Stack>
										</Table.Cell>
										<Table.Cell>
											<Text fontWeight="medium">{step.variable}</Text>
										</Table.Cell>
										<Table.Cell textAlign="end">
											<FormatNumber value={step.rhoPrediction} maximumFractionDigits={3} minimumFractionDigits={3} />
										</Table.Cell>
										<Table.Cell textAlign="end">
											<FormatNumber value={step.rhoHoldout} maximumFractionDigits={3} minimumFractionDigits={3} />
										</Table.Cell>
									</Table.Row>
								);
							})}
						</Table.Body>
					</Table.Root>
				</Table.ScrollArea>
			</Stack>
		</Box>
	);
}

function bestNumber(value: number | null | undefined): number | null {
	return typeof value === "number" ? value : null;
}
