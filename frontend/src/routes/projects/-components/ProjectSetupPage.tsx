import { Button, Field, Flex, Grid, Input, SegmentGroup, Stack, Text } from "@chakra-ui/react";
import type { FormEvent, ReactNode } from "react";
import LinePlot from "../../../components/LinePlot.tsx";
import { ChartScrollArea } from "../../../components/ui/ChartScrollArea.tsx";
import { ErrorState } from "../../../components/ui/ErrorState.tsx";
import { LoadingState } from "../../../components/ui/LoadingState.tsx";
import { Panel } from "../../../components/ui/Panel.tsx";
import type { FoldRanges } from "../-utils/foldRanges.ts";
import type { AnalysisBackend, ColumnSummary, DatasetOverview, ProjectSettings } from "../-utils/model.ts";
import type { VariableRole } from "../-utils/settings.ts";
import { FoldRangeSlider } from "./FoldRangeSlider.tsx";
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
	settings: ProjectSettings;
	onSettingsChange: (settings: ProjectSettings) => void;
	onBackendChange: (backend: AnalysisBackend) => void;
	onVariableRoleChange: (column: string, role: VariableRole) => void;
	totalPoints?: number;
	onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
	isSubmitting?: boolean;
	formError?: ReactNode;
	submitLabel?: string;
	submitDisabled?: boolean;
	status?: RunStatus;
	headerActions?: ReactNode;
	secondaryAction?: ReactNode;
	onStepSelect?: (step: ProjectWorkflowStepId) => void;
	completedSteps?: ProjectWorkflowStepId[];
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
	settings,
	onSettingsChange,
	onBackendChange,
	onVariableRoleChange,
	totalPoints,
	onSubmit,
	isSubmitting = false,
	formError,
	submitLabel = "Run analysis",
	submitDisabled,
	status = "draft",
	headerActions,
	secondaryAction,
	onStepSelect,
	completedSteps,
}: ProjectSetupPageProps) {
	const datasetColumns = columns ?? dataset?.columns ?? [];
	const pointCount = totalPoints ?? dataset?.pointCount ?? 0;
	const disabled = submitDisabled ?? (settings.targets.length === 0 || !onSubmit);

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
			completedSteps={completedSteps}
			statusBanner={<RunStatusBanner status={status} secondaryAction={secondaryAction} />}
		>
			<form onSubmit={handleSubmit}>
				<Grid templateColumns={{ base: "1fr", xl: "minmax(0, 1fr) 380px" }} gap={6} alignItems="start">
					<Stack gap={6} minW={0}>
						<VariableRoleTable
							columns={datasetColumns}
							settings={settings}
							onRoleChange={onVariableRoleChange}
							selectedVariable={selectedVariable}
							onSelectVariable={onSelectVariable}
							isLoading={isDatasetLoading}
							error={datasetError}
						/>
						<PreviewPanel variable={selectedVariable} data={previewData} isLoading={isPreviewLoading} error={previewError} />
					</Stack>

					<Stack gap={6} minW={0}>
						<RunParametersPanel
							settings={settings}
							onSettingsChange={onSettingsChange}
							onBackendChange={onBackendChange}
							totalPoints={pointCount}
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
	settings,
	onSettingsChange,
	onBackendChange,
	totalPoints,
}: {
	settings: ProjectSettings;
	onSettingsChange: (settings: ProjectSettings) => void;
	onBackendChange: (backend: AnalysisBackend) => void;
	totalPoints: number;
}) {
	const backend = settings.backend ?? "edmkit";
	const ranges: FoldRanges = {
		libraryRange: settings.libraryRange,
		predictionRange: settings.predictionRange,
		holdoutRange: settings.holdoutRange,
	};

	return (
		<Panel
			eyebrow="Settings"
			title="Run parameters"
			description="Control the greedy search limit, fold layout, and reproducibility seed."
		>
			<Stack gap={5}>
				<Field.Root>
					<Field.Label>Analysis backend</Field.Label>
					<SegmentGroup.Root
						value={backend}
						onValueChange={(details) => {
							const value = details.value;
							if (value === "edmkit" || value === "dimx") {
								onBackendChange(value);
							}
						}}
					>
						<SegmentGroup.Indicator />
						<SegmentGroup.Items
							items={[
								{ value: "dimx", label: "dimx" },
								{ value: "edmkit", label: "edmkit" },
							]}
						/>
					</SegmentGroup.Root>
					<Field.HelperText>dimx uses the official MDE implementation and accepts one target column.</Field.HelperText>
				</Field.Root>

				<Field.Root>
					<Field.Label>Maximum variables to select</Field.Label>
					<Input
						type="number"
						min={1}
						value={Number.isFinite(settings.maxVariables) ? settings.maxVariables : ""}
						onChange={(event) => {
							const value = Number.parseInt(event.target.value, 10);
							onSettingsChange({ ...settings, maxVariables: Number.isNaN(value) ? 1 : Math.max(1, value) });
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
						value={Number.isFinite(settings.prefilterThreshold) ? settings.prefilterThreshold : ""}
						onChange={(event) => {
							const raw = event.target.value;
							if (raw === "") {
								onSettingsChange({ ...settings, prefilterThreshold: 0 });
								return;
							}
							const value = Number.parseFloat(raw);
							onSettingsChange({
								...settings,
								prefilterThreshold: Number.isNaN(value) ? 0 : Math.min(1, Math.max(0, value)),
							});
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
							ranges={ranges}
							onRangesChange={(nextRanges) => onSettingsChange({ ...settings, ...nextRanges })}
						/>
					) : (
						<Text color="fg.muted">Fold ranges are available after the dataset summary loads.</Text>
					)}
				</Stack>

				<Field.Root>
					<Field.Label>Random seed</Field.Label>
					<Input
						type="number"
						value={settings.seed}
						onChange={(event) => {
							const value = Number.parseInt(event.target.value, 10);
							onSettingsChange({ ...settings, seed: Number.isNaN(value) ? 0 : value });
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
