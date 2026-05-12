import { Badge, DataList, FormatNumber, Stack, Table, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import OverlayPlot from "../../../components/OverlayPlot.tsx";
import { ChartScrollArea } from "../../../components/ui/ChartScrollArea.tsx";
import { ErrorState } from "../../../components/ui/ErrorState.tsx";
import { LoadingState } from "../../../components/ui/LoadingState.tsx";
import { Panel } from "../../../components/ui/Panel.tsx";
import type { PointRange, PrefilterSummary, ProjectResult, ProjectSettings } from "../-utils/model.ts";
import type { ProjectWorkflowStepId } from "./ProjectLayoutShell.tsx";
import { ProjectLayoutShell } from "./ProjectLayoutShell.tsx";
import type { RunStatus } from "./RunStatusBanner.tsx";
import { RunStatusBanner } from "./RunStatusBanner.tsx";

export interface ProjectResultsPageProps {
	title?: ReactNode;
	description?: ReactNode;
	filename?: string;
	settings?: ProjectSettings | null;
	result?: ProjectResult | null;
	status?: RunStatus;
	isLoading?: boolean;
	error?: ReactNode;
	onRetry?: () => void;
	headerActions?: ReactNode;
	primaryAction?: ReactNode;
	secondaryAction?: ReactNode;
	onStepSelect?: (step: ProjectWorkflowStepId) => void;
}

export function ProjectResultsPage({
	title = "Analysis results",
	description = "Review the selected variables, holdout prediction skill, and actual-vs-predicted plots.",
	filename,
	settings,
	result,
	status,
	isLoading = false,
	error,
	onRetry,
	headerActions,
	primaryAction,
	secondaryAction,
	onStepSelect,
}: ProjectResultsPageProps) {
	const runStatus = status ?? (result ? "completed" : "running");
	const activeStep = result ? "results" : "run";

	return (
		<ProjectLayoutShell
			eyebrow={filename}
			title={title}
			description={description}
			activeStep={activeStep}
			actions={headerActions}
			onStepSelect={onStepSelect}
			statusBanner={<RunStatusBanner status={runStatus} primaryAction={primaryAction} secondaryAction={secondaryAction} />}
			sidebar={
				<Stack gap={6}>
					<SettingsSummaryPanel filename={filename} settings={settings} />
					{result ? <FoldSummaryPanel result={result} /> : null}
					{result?.prefilter ? <PrefilterSummaryPanel prefilter={result.prefilter} /> : null}
				</Stack>
			}
		>
			{isLoading ? (
				<Panel>
					<LoadingState title="Loading results" showSkeleton />
				</Panel>
			) : error ? (
				<ErrorState title="Results could not be loaded" description={error} onRetry={onRetry} />
			) : result ? (
				<Stack gap={6}>
					<PredictionSkillPanel result={result} />
					<BestStepPanel result={result} settings={settings} />
					<SelectedVariablesPanel result={result} />
				</Stack>
			) : (
				<Panel title="Results pending">
					<Text color="fg.muted">Results will be available after the analysis run completes.</Text>
				</Panel>
			)}
		</ProjectLayoutShell>
	);
}

function SettingsSummaryPanel({ filename, settings }: { filename?: string; settings?: ProjectSettings | null }) {
	return (
		<Panel title="Settings" description={filename}>
			{settings ? (
				<DataList.Root size="sm" colorPalette="gray">
					<DataList.Item>
						<DataList.ItemLabel>Backend</DataList.ItemLabel>
						<DataList.ItemValue>{formatBackend(settings.backend)}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Targets</DataList.ItemLabel>
						<DataList.ItemValue>{settings.targets.join(", ")}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Max variables</DataList.ItemLabel>
						<DataList.ItemValue>{settings.maxVariables}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Training library</DataList.ItemLabel>
						<DataList.ItemValue>{formatRange(settings.libraryRange)}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Training prediction</DataList.ItemLabel>
						<DataList.ItemValue>{formatRange(settings.predictionRange)}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Holdout</DataList.ItemLabel>
						<DataList.ItemValue>{formatRange(settings.holdoutRange)}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Excluded</DataList.ItemLabel>
						<DataList.ItemValue>{settings.excludeColumns?.length ?? 0}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Pre-filter ρ ≥</DataList.ItemLabel>
						<DataList.ItemValue>
							{settings.prefilterThreshold > 0 ? settings.prefilterThreshold.toFixed(2) : "off"}
						</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Seed</DataList.ItemLabel>
						<DataList.ItemValue>{settings.seed}</DataList.ItemValue>
					</DataList.Item>
				</DataList.Root>
			) : (
				<Text color="fg.muted">Settings were not provided to this result view.</Text>
			)}
		</Panel>
	);
}

function PrefilterSummaryPanel({ prefilter }: { prefilter: PrefilterSummary }) {
	const dropped = prefilter.droppedColumns ?? [];
	const droppedPreview = dropped.slice(0, 6).join(", ");
	const overflow = dropped.length - 6;
	return (
		<Panel title="Pre-filter">
			<DataList.Root size="sm" colorPalette="gray">
				<DataList.Item>
					<DataList.ItemLabel>Threshold</DataList.ItemLabel>
					<DataList.ItemValue>{prefilter.threshold.toFixed(2)}</DataList.ItemValue>
				</DataList.Item>
				<DataList.Item>
					<DataList.ItemLabel>Variables kept</DataList.ItemLabel>
					<DataList.ItemValue>
						{prefilter.kept.toLocaleString()} / {prefilter.total.toLocaleString()}
					</DataList.ItemValue>
				</DataList.Item>
				{dropped.length > 0 ? (
					<DataList.Item>
						<DataList.ItemLabel>Dropped</DataList.ItemLabel>
						<DataList.ItemValue>
							{droppedPreview}
							{overflow > 0 ? ` +${overflow} more` : null}
						</DataList.ItemValue>
					</DataList.Item>
				) : null}
			</DataList.Root>
		</Panel>
	);
}

function FoldSummaryPanel({ result }: { result: ProjectResult }) {
	return (
		<Panel title="Fold layout">
			<DataList.Root size="sm" colorPalette="gray">
				<DataList.Item>
					<DataList.ItemLabel>Training library</DataList.ItemLabel>
					<DataList.ItemValue>{result.fold.librarySize.toLocaleString()}</DataList.ItemValue>
				</DataList.Item>
				<DataList.Item>
					<DataList.ItemLabel>Training prediction</DataList.ItemLabel>
					<DataList.ItemValue>{result.fold.predictionSize.toLocaleString()}</DataList.ItemValue>
				</DataList.Item>
				<DataList.Item>
					<DataList.ItemLabel>Holdout</DataList.ItemLabel>
					<DataList.ItemValue>{result.fold.holdoutSize.toLocaleString()}</DataList.ItemValue>
				</DataList.Item>
			</DataList.Root>
		</Panel>
	);
}

function PredictionSkillPanel({ result }: { result: ProjectResult }) {
	if (result.steps.length === 0) {
		return (
			<Panel title="Prediction skill">
				<Text color="fg.muted">No variables were selected.</Text>
			</Panel>
		);
	}

	const stepIndices = result.steps.map((_, index) => index + 1);
	const width = Math.max(640, result.steps.length * 64);

	return (
		<Panel
			title="Prediction skill across greedy steps"
			description="Prediction-range rho drives selection; holdout rho measures final generalisation."
		>
			<ChartScrollArea ariaLabel="Prediction skill across greedy steps" minWidth={width}>
				<OverlayPlot
					series={[
						{
							name: "Training prediction rho",
							color: "#0EA5E9",
							data: result.steps.map((step) => step.rhoPrediction),
							dashed: true,
						},
						{
							name: "Holdout rho",
							color: "#166534",
							data: result.steps.map((step) => step.rhoHoldout),
						},
					]}
					xValues={stepIndices}
					width={width}
					height={320}
					xLabel="Greedy step"
					yLabel="rho"
					showPoints
				/>
			</ChartScrollArea>
		</Panel>
	);
}

function BestStepPanel({ result, settings }: { result: ProjectResult; settings?: ProjectSettings | null }) {
	const bestStep = result.bestStep;

	if (!bestStep) {
		return (
			<Panel title="Best step actual vs predicted">
				<Text color="fg.muted">No best step is available for this run.</Text>
			</Panel>
		);
	}

	const holdoutStart = settings?.holdoutRange.start ?? 1;

	return (
		<Panel
			title="Best step actual vs predicted"
			description={`Step ${bestStep.stepIndex} achieved holdout rho ${bestStep.rho.toFixed(3)}.`}
		>
			<Stack gap={6}>
				{bestStep.plots.map((plot) => {
					const xValues = plot.observed.map((_, index) => holdoutStart + index);
					const width = Math.max(640, Math.min(plot.observed.length * 2, 1400));
					return (
						<Stack key={plot.name} gap={2}>
							<Text fontWeight="medium">{plot.name}</Text>
							<ChartScrollArea ariaLabel={`${plot.name} actual vs predicted`} minWidth={width}>
								<OverlayPlot
									series={[
										{ name: "Observed", color: "#111827", data: plot.observed },
										{ name: "Predicted", color: "#DC2626", data: plot.predicted, dashed: true },
									]}
									xValues={xValues}
									width={width}
									height={280}
									xLabel="Point index"
									yLabel={plot.name}
								/>
							</ChartScrollArea>
						</Stack>
					);
				})}
			</Stack>
		</Panel>
	);
}

function SelectedVariablesPanel({ result }: { result: ProjectResult }) {
	const bestIndex = typeof result.bestStep?.stepIndex === "number" ? result.bestStep.stepIndex : null;

	if (result.steps.length === 0) {
		return (
			<Panel title="Selected variables">
				<Text color="fg.muted">No variables were selected.</Text>
			</Panel>
		);
	}

	return (
		<Panel title="Selected variables" description="Variables are listed in greedy selection order.">
			<Table.ScrollArea borderWidth="1px" borderColor="gray.100" borderRadius="8px" maxH="480px">
				<Table.Root size="sm" stickyHeader variant="line">
					<Table.Header>
						<Table.Row bg="gray.50" boxShadow="sm">
							<Table.ColumnHeader>Step</Table.ColumnHeader>
							<Table.ColumnHeader>Variable</Table.ColumnHeader>
							<Table.ColumnHeader textAlign="end">rho prediction</Table.ColumnHeader>
							<Table.ColumnHeader textAlign="end">rho holdout</Table.ColumnHeader>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{result.steps.map((step, index) => {
							const stepNumber = index + 1;
							const isBest = bestIndex === stepNumber;
							return (
								<Table.Row key={`${stepNumber}-${step.variable}`} bg={isBest ? "green.50" : undefined}>
									<Table.Cell>
										<Stack direction="row" gap={2} align="center">
											<Text>{stepNumber}</Text>
											{isBest ? (
												<Badge colorPalette="green" size="xs">
													best
												</Badge>
											) : null}
										</Stack>
									</Table.Cell>
									<Table.Cell>
										<Text fontWeight="medium">{step.variable}</Text>
									</Table.Cell>
									<Table.Cell textAlign="end">
										<FormatNumber value={step.rhoPrediction} minimumFractionDigits={3} maximumFractionDigits={3} />
									</Table.Cell>
									<Table.Cell textAlign="end">
										<FormatNumber value={step.rhoHoldout} minimumFractionDigits={3} maximumFractionDigits={3} />
									</Table.Cell>
								</Table.Row>
							);
						})}
					</Table.Body>
				</Table.Root>
			</Table.ScrollArea>
		</Panel>
	);
}

function formatRange(range: PointRange) {
	return `${range.start.toLocaleString()} - ${range.end.toLocaleString()}`;
}

function formatBackend(backend: ProjectSettings["backend"]) {
	return backend === "dimx" ? "dimx" : "edmkit";
}
