import { Badge, Button, FormatNumber, Stack, Table, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import type { ColumnSummary } from "../../../components/projects/types.ts";
import { ErrorState } from "../../../components/ui/ErrorState.tsx";
import { LoadingState } from "../../../components/ui/LoadingState.tsx";
import { Panel } from "../../../components/ui/Panel.tsx";

export type VariableRole = "target" | "candidate" | "excluded";

export interface VariableRoleTableProps {
	columns: ColumnSummary[];
	targets: string[];
	excludedColumns: string[];
	onTargetsChange: (targets: string[]) => void;
	onExcludedColumnsChange: (columns: string[]) => void;
	selectedVariable?: string | null;
	onSelectVariable?: (column: string) => void;
	allowMultipleTargets?: boolean;
	isLoading?: boolean;
	error?: string | null;
	maxHeight?: number | string;
	title?: ReactNode;
	description?: ReactNode;
}

export function VariableRoleTable({
	columns,
	targets,
	excludedColumns,
	onTargetsChange,
	onExcludedColumnsChange,
	selectedVariable,
	onSelectVariable,
	allowMultipleTargets = true,
	isLoading = false,
	error,
	maxHeight = 520,
	title = "Variables",
	description = "Assign each column as a target, candidate predictor, or excluded variable before running the analysis.",
}: VariableRoleTableProps) {
	const targetSet = new Set(targets);
	const excludedSet = new Set(excludedColumns);

	const assignRole = (name: string, role: VariableRole) => {
		if (role === "target") {
			const nextTargets = allowMultipleTargets ? unique([...targets, name]) : [name];
			onTargetsChange(nextTargets);
			onExcludedColumnsChange(excludedColumns.filter((column) => column !== name));
			return;
		}

		if (role === "excluded") {
			onTargetsChange(targets.filter((column) => column !== name));
			onExcludedColumnsChange(unique([...excludedColumns.filter((column) => column !== name), name]));
			return;
		}

		onTargetsChange(targets.filter((column) => column !== name));
		onExcludedColumnsChange(excludedColumns.filter((column) => column !== name));
	};

	return (
		<Panel eyebrow="Dataset" title={title} description={description}>
			{isLoading ? (
				<LoadingState title="Loading dataset summary" />
			) : error ? (
				<ErrorState title="Dataset summary is unavailable" description={error} />
			) : columns.length === 0 ? (
				<Text color="fg.muted">No columns were found in this dataset.</Text>
			) : (
				<Stack gap={3}>
					<Stack direction="row" gap={3} align="center" wrap="wrap" color="fg.muted" fontSize="sm">
						<Text>{columns.length.toLocaleString()} variables</Text>
						<Text>{targets.length.toLocaleString()} targets</Text>
						<Text>{excludedColumns.length.toLocaleString()} excluded</Text>
					</Stack>
					<Table.ScrollArea borderWidth="1px" borderColor="gray.100" borderRadius="8px" maxH={maxHeight}>
						<Table.Root size="sm" stickyHeader variant="line">
							<Table.Header>
								<Table.Row bg="gray.50" boxShadow="sm">
									<Table.ColumnHeader minW="220px">Variable</Table.ColumnHeader>
									<Table.ColumnHeader>Role</Table.ColumnHeader>
									<Table.ColumnHeader textAlign="end">Missing</Table.ColumnHeader>
									<Table.ColumnHeader textAlign="end">Mean</Table.ColumnHeader>
									<Table.ColumnHeader textAlign="end">Std</Table.ColumnHeader>
									<Table.ColumnHeader textAlign="end">Min</Table.ColumnHeader>
									<Table.ColumnHeader textAlign="end">Max</Table.ColumnHeader>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{columns.map((column) => {
									const role = roleFor(column.name, targetSet, excludedSet);
									const isSelected = column.name === selectedVariable;
									return (
										<Table.Row
											key={column.name}
											bg={isSelected ? "blue.50" : undefined}
											_hover={{ bg: isSelected ? "blue.100" : "gray.50" }}
											cursor={onSelectVariable ? "pointer" : undefined}
											tabIndex={onSelectVariable ? 0 : undefined}
											onClick={() => onSelectVariable?.(column.name)}
											onKeyDown={(event) => {
												if (!onSelectVariable) return;
												if (event.key === "Enter" || event.key === " ") {
													event.preventDefault();
													onSelectVariable(column.name);
												}
											}}
										>
											<Table.Cell>
												<Stack gap={1}>
													<Stack direction="row" gap={2} align="center" wrap="wrap">
														<Text fontWeight="medium" color="fg">
															{column.name}
														</Text>
														<RoleBadge role={role} />
													</Stack>
													<Text fontSize="xs" color="fg.muted">
														{column.dtype}
													</Text>
												</Stack>
											</Table.Cell>
											<Table.Cell>
												<Stack direction="row" gap={1} align="center" wrap="nowrap">
													<RoleButton active={role === "target"} onClick={() => assignRole(column.name, "target")}>
														Target
													</RoleButton>
													<RoleButton active={role === "candidate"} onClick={() => assignRole(column.name, "candidate")}>
														Candidate
													</RoleButton>
													<RoleButton active={role === "excluded"} onClick={() => assignRole(column.name, "excluded")}>
														Exclude
													</RoleButton>
												</Stack>
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
		</Panel>
	);
}

function RoleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
	return (
		<Button
			type="button"
			size="xs"
			variant={active ? "solid" : "outline"}
			colorPalette={active ? "blue" : "gray"}
			aria-pressed={active}
			whiteSpace="nowrap"
			onClick={(event) => {
				event.stopPropagation();
				onClick();
			}}
		>
			{children}
		</Button>
	);
}

function RoleBadge({ role }: { role: VariableRole }) {
	if (role === "target") {
		return (
			<Badge colorPalette="blue" size="xs">
				target
			</Badge>
		);
	}
	if (role === "excluded") {
		return (
			<Badge colorPalette="gray" size="xs">
				excluded
			</Badge>
		);
	}
	return (
		<Badge colorPalette="green" size="xs">
			candidate
		</Badge>
	);
}

function roleFor(name: string, targetSet: Set<string>, excludedSet: Set<string>): VariableRole {
	if (targetSet.has(name)) return "target";
	if (excludedSet.has(name)) return "excluded";
	return "candidate";
}

function formatNumber(value: number | null | undefined): ReactNode {
	if (value == null || Number.isNaN(value)) {
		return "-";
	}

	const rounded = Math.round(value * 1000) / 1000;
	const isInteger = Number.isInteger(rounded);
	return <FormatNumber value={rounded} minimumFractionDigits={isInteger ? 0 : 3} maximumFractionDigits={isInteger ? 0 : 3} />;
}

function unique(values: string[]) {
	return Array.from(new Set(values));
}
