import { Button, Field, Flex, Grid, Input, Stack, Text } from "@chakra-ui/react";
import type { FormEvent, ReactNode } from "react";
import LinePlot from "../../../components/LinePlot.tsx";
import { FoldRangeSlider } from "../../../components/projects/FoldRangeSlider.tsx";
import type { ColumnSummary, DatasetOverview } from "../../../components/projects/types.ts";
import { ChartScrollArea } from "../../../components/ui/ChartScrollArea.tsx";
import { ErrorState } from "../../../components/ui/ErrorState.tsx";
import { LoadingState } from "../../../components/ui/LoadingState.tsx";
import { Panel } from "../../../components/ui/Panel.tsx";
import type { ProjectWorkflowStepId } from "./ProjectLayoutShell.tsx";
import { ProjectLayoutShell } from "./ProjectLayoutShell.tsx";
import type { RunStatus } from "./RunStatusBanner.tsx";
import { RunStatusBanner } from "./RunStatusBanner.tsx";
import { VariableRoleTable } from "./VariableRoleTable.tsx";

export interface ProjectSetupPageProps {
	title?: ReactNode;
	description?: ReactNode;
	filename?: string;
	dataset?: DatasetOverview | null;
	columns?: ColumnSummary[];
	isDatasetLoading?: boolean;
	datasetError?: string | null;
	selectedVariable?: string | null;
	onSelectVariable?: (column: string) => void;
	previewData?: number[] | null;
	isPreviewLoading?: boolean;
	previewError?: string | null;
	targets: string[];
	onTargetsChange: (targets: string[]) => void;
	excludeColumns: string[];
	onExcludeColumnsChange: (columns: string[]) => void;
	maxVariables: number;
	onMaxVariablesChange: (value: number) => void;
	prefilterThreshold: number;
	onPrefilterThresholdChange: (value: number) => void;
	totalPoints?: number;
	libraryRange: [number, number];
	onLibraryRangeChange: (range: [number, number]) => void;
	predictionRange: [number, number];
	onPredictionRangeChange: (range: [number, number]) => void;
	holdoutRange: [number, number];
	onHoldoutRangeChange: (range: [number, number]) => void;
	seed: number;
	onSeedChange: (value: number) => void;
	onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
	isSubmitting?: boolean;
	formError?: ReactNode;
	submitLabel?: string;
	submitDisabled?: boolean;
	status?: RunStatus;
	headerActions?: ReactNode;
	secondaryAction?: ReactNode;
	onStepSelect?: (step: ProjectWorkflowStepId) => void;
}

export function ProjectSetupPage({
	title = "Configure analysis",
	description = "Assign variables, tune fold ranges, and launch the greedy selection run.",
	filename,
	dataset,
	columns,
	isDatasetLoading = false,
	datasetError,
	selectedVariable,
	onSelectVariable,
	previewData,
	isPreviewLoading = false,
	previewError,
	targets,
	onTargetsChange,
	excludeColumns,
	onExcludeColumnsChange,
	maxVariables,
	onMaxVariablesChange,
	prefilterThreshold,
	onPrefilterThresholdChange,
	totalPoints,
	libraryRange,
	onLibraryRangeChange,
	predictionRange,
	onPredictionRangeChange,
	holdoutRange,
	onHoldoutRangeChange,
	seed,
	onSeedChange,
	onSubmit,
	isSubmitting = false,
	formError,
	submitLabel = "Run analysis",
	submitDisabled,
	status = "draft",
	headerActions,
	secondaryAction,
	onStepSelect,
}: ProjectSetupPageProps) {
	const datasetColumns = columns ?? dataset?.columns ?? [];
	const pointCount = totalPoints ?? dataset?.pointCount ?? 0;
	const disabled = submitDisabled ?? (targets.length === 0 || !onSubmit);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		if (!onSubmit) {
			event.preventDefault();
			return;
		}
		onSubmit(event);
	};

	return (
		<ProjectLayoutShell
			eyebrow={filename}
			title={title}
			description={description}
			activeStep="settings"
			actions={headerActions}
			onStepSelect={onStepSelect}
			statusBanner={<RunStatusBanner status={status} secondaryAction={secondaryAction} />}
		>
			<form onSubmit={handleSubmit}>
				<Grid templateColumns={{ base: "1fr", xl: "minmax(0, 1fr) 380px" }} gap={6} alignItems="start">
					<Stack gap={6} minW={0}>
						<VariableRoleTable
							columns={datasetColumns}
							targets={targets}
							excludedColumns={excludeColumns}
							onTargetsChange={onTargetsChange}
							onExcludedColumnsChange={onExcludeColumnsChange}
							selectedVariable={selectedVariable}
							onSelectVariable={onSelectVariable}
							isLoading={isDatasetLoading}
							error={datasetError}
						/>
						<PreviewPanel variable={selectedVariable} data={previewData} isLoading={isPreviewLoading} error={previewError} />
					</Stack>

					<Stack gap={6} minW={0}>
						<RunParametersPanel
							totalPoints={pointCount}
							maxVariables={maxVariables}
							onMaxVariablesChange={onMaxVariablesChange}
							prefilterThreshold={prefilterThreshold}
							onPrefilterThresholdChange={onPrefilterThresholdChange}
							libraryRange={libraryRange}
							onLibraryRangeChange={onLibraryRangeChange}
							predictionRange={predictionRange}
							onPredictionRangeChange={onPredictionRangeChange}
							holdoutRange={holdoutRange}
							onHoldoutRangeChange={onHoldoutRangeChange}
							seed={seed}
							onSeedChange={onSeedChange}
						/>
						<Panel>
							<Stack gap={4}>
								{formError ? <ErrorState title="Run could not be started" description={formError} /> : null}
								<Flex justify="flex-end" gap={2} wrap="wrap">
									<Button type="submit" colorPalette="blue" loading={isSubmitting} disabled={disabled}>
										{submitLabel}
									</Button>
								</Flex>
							</Stack>
						</Panel>
					</Stack>
				</Grid>
			</form>
		</ProjectLayoutShell>
	);
}

function RunParametersPanel({
	totalPoints,
	maxVariables,
	onMaxVariablesChange,
	prefilterThreshold,
	onPrefilterThresholdChange,
	libraryRange,
	onLibraryRangeChange,
	predictionRange,
	onPredictionRangeChange,
	holdoutRange,
	onHoldoutRangeChange,
	seed,
	onSeedChange,
}: {
	totalPoints: number;
	maxVariables: number;
	onMaxVariablesChange: (value: number) => void;
	prefilterThreshold: number;
	onPrefilterThresholdChange: (value: number) => void;
	libraryRange: [number, number];
	onLibraryRangeChange: (range: [number, number]) => void;
	predictionRange: [number, number];
	onPredictionRangeChange: (range: [number, number]) => void;
	holdoutRange: [number, number];
	onHoldoutRangeChange: (range: [number, number]) => void;
	seed: number;
	onSeedChange: (value: number) => void;
}) {
	return (
		<Panel
			eyebrow="Settings"
			title="Run parameters"
			description="Control the greedy search limit, fold layout, and reproducibility seed."
		>
			<Stack gap={5}>
				<Field.Root>
					<Field.Label>Maximum variables to select</Field.Label>
					<Input
						type="number"
						min={1}
						value={Number.isFinite(maxVariables) ? maxVariables : ""}
						onChange={(event) => {
							const value = Number.parseInt(event.target.value, 10);
							onMaxVariablesChange(Number.isNaN(value) ? 1 : Math.max(1, value));
						}}
					/>
				</Field.Root>

				<Field.Root>
					<Field.Label>Pre-filter ρ threshold</Field.Label>
					<Input
						type="number"
						min={0}
						max={1}
						step={0.01}
						value={Number.isFinite(prefilterThreshold) ? prefilterThreshold : ""}
						onChange={(event) => {
							const raw = event.target.value;
							if (raw === "") {
								onPrefilterThresholdChange(0);
								return;
							}
							const value = Number.parseFloat(raw);
							if (Number.isNaN(value)) {
								onPrefilterThresholdChange(0);
								return;
							}
							onPrefilterThresholdChange(Math.min(1, Math.max(0, value)));
						}}
					/>
					<Field.HelperText>
						Drop candidates whose best univariate embedded ρ on the library + prediction rows is below this value. Set to 0 to
						disable.
					</Field.HelperText>
				</Field.Root>

				<Stack gap={2}>
					<Text fontWeight="medium">Fold layout</Text>
					{totalPoints > 0 ? (
						<FoldRangeSlider
							totalPoints={totalPoints}
							libraryRange={libraryRange}
							onLibraryRangeChange={onLibraryRangeChange}
							predictionRange={predictionRange}
							onPredictionRangeChange={onPredictionRangeChange}
							holdoutRange={holdoutRange}
							onHoldoutRangeChange={onHoldoutRangeChange}
						/>
					) : (
						<Text color="fg.muted">Fold ranges are available after the dataset summary loads.</Text>
					)}
				</Stack>

				<Field.Root>
					<Field.Label>Random seed</Field.Label>
					<Input
						type="number"
						value={seed}
						onChange={(event) => {
							const value = Number.parseInt(event.target.value, 10);
							onSeedChange(Number.isNaN(value) ? 0 : value);
						}}
					/>
				</Field.Root>
			</Stack>
		</Panel>
	);
}

function PreviewPanel({
	variable,
	data,
	isLoading,
	error,
}: {
	variable?: string | null;
	data?: number[] | null;
	isLoading: boolean;
	error?: string | null;
}) {
	const width = Math.max(640, Math.min((data?.length ?? 0) * 2, 1400));

	return (
		<Panel title="Time series preview" description="Inspect the selected variable before running the analysis.">
			{!variable ? (
				<Text color="fg.muted">Select a variable to preview its raw time series.</Text>
			) : isLoading ? (
				<LoadingState title={`Loading ${variable}`} />
			) : error ? (
				<ErrorState title="Preview is unavailable" description={error} />
			) : data && data.length > 0 ? (
				<ChartScrollArea ariaLabel={`${variable} time series preview`} minWidth={width}>
					<LinePlot data={data} width={width} height={320} />
				</ChartScrollArea>
			) : (
				<Text color="fg.muted">No preview data is available for {variable}.</Text>
			)}
		</Panel>
	);
}
