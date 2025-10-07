import { Box, FormatNumber, Stack, Table, Text } from "@chakra-ui/react";
import type { ProjectResult } from "./types.ts";

interface ResultTableProps {
	result: ProjectResult;
}

export function ResultTable({ result }: ResultTableProps) {
	const entries = Object.entries(result);

	if (entries.length === 0) {
		return (
			<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
				<Text color="fg.muted">No result entries available yet.</Text>
			</Box>
		);
	}

	return (
		<Box bg="white" borderRadius="xl" boxShadow="sm" p={6}>
			<Stack gap={4}>
				<Text as="h3" fontSize="lg" fontWeight="semibold">
					rho values
				</Text>
				<Table.ScrollArea borderWidth="1px" borderColor="gray.100" borderRadius="lg" maxH="480px">
					<Table.Root size="sm" stickyHeader variant="line">
						<Table.Header>
							<Table.Row bg="gray.50" boxShadow="sm">
								<Table.ColumnHeader>Variable</Table.ColumnHeader>
								<Table.ColumnHeader textAlign="end">rho</Table.ColumnHeader>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{entries.map(([variable, value]) => (
								<Table.Row key={variable}>
									<Table.Cell>
										<Text fontWeight="medium">{variable}</Text>
									</Table.Cell>
									<Table.Cell textAlign="end">
										<FormatNumber value={value} maximumFractionDigits={3} minimumFractionDigits={3} />
									</Table.Cell>
								</Table.Row>
							))}
						</Table.Body>
					</Table.Root>
				</Table.ScrollArea>
			</Stack>
		</Box>
	);
}
