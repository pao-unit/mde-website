import { DataList, Grid, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { ErrorState } from "../../../components/ui/ErrorState.tsx";
import { LoadingState } from "../../../components/ui/LoadingState.tsx";
import { Panel } from "../../../components/ui/Panel.tsx";
import type { DatasetOverview, PointRange, ProjectResult, ProjectSettings } from "../-utils/model.ts";
import type { ProjectWorkflowStepId } from "./ProjectLayoutShell.tsx";
import { ProjectLayoutShell } from "./ProjectLayoutShell.tsx";
import type { RunStatus } from "./RunStatusBanner.tsx";
import { RunStatusBanner } from "./RunStatusBanner.tsx";

export interface ProjectDashboardProps {
	title?: ReactNode;
	description?: ReactNode;
	filename?: string;
	dataset?: DatasetOverview | null;
	settings?: ProjectSettings | null;
	result?: ProjectResult | null;
	status?: RunStatus;
	isLoading?: boolean;
	error?: ReactNode;
	onRetry?: () => void;
	primaryAction?: ReactNode;
	secondaryAction?: ReactNode;
	headerActions?: ReactNode;
	onStepSelect?: (step: ProjectWorkflowStepId) => void;
	children?: ReactNode;
}

export function ProjectDashboard({
	title = "Project workspace",
	description = "Move through dataset review, analysis settings, execution, and result inspection from one project view.",
	filename,
	dataset,
	settings,
	result,
	status,
	isLoading = false,
	error,
	onRetry,
	primaryAction,
	secondaryAction,
	headerActions,
	onStepSelect,
	children,
}: ProjectDashboardProps) {
	const runStatus = status ?? deriveStatus(settings, result);
	const activeStep = activeStepFor(runStatus, settings, result);

	return (
		<ProjectLayoutShell
			eyebrow={filename}
			title={title}
			description={description}
			activeStep={activeStep}
			actions={headerActions}
			onStepSelect={onStepSelect}
			statusBanner={<RunStatusBanner status={runStatus} primaryAction={primaryAction} secondaryAction={secondaryAction} />}
		>
			{isLoading ? (
				<Panel>
					<LoadingState title="Loading project" showSkeleton />
				</Panel>
			) : error ? (
				<ErrorState title="Project could not be loaded" description={error} onRetry={onRetry} />
			) : (
				<Stack gap={6}>
					<Grid templateColumns={{ base: "1fr", lg: "repeat(3, minmax(0, 1fr))" }} gap={4} alignItems="stretch">
						<DatasetPanel filename={filename} dataset={dataset} />
						<SettingsPanel settings={settings} />
						<ResultPanel result={result} status={runStatus} />
					</Grid>
					{children}
				</Stack>
			)}
		</ProjectLayoutShell>
	);
}

function DatasetPanel({ filename, dataset }: { filename?: string; dataset?: DatasetOverview | null }) {
	return (
		<Panel title="Dataset" description={filename ?? "No file selected"}>
			<DataList.Root size="sm" colorPalette="gray">
				<DataList.Item>
					<DataList.ItemLabel>Variables</DataList.ItemLabel>
					<DataList.ItemValue>{(dataset?.columns.length ?? 0).toLocaleString()}</DataList.ItemValue>
				</DataList.Item>
				<DataList.Item>
					<DataList.ItemLabel>Points</DataList.ItemLabel>
					<DataList.ItemValue>{(dataset?.pointCount ?? 0).toLocaleString()}</DataList.ItemValue>
				</DataList.Item>
			</DataList.Root>
		</Panel>
	);
}

function SettingsPanel({ settings }: { settings?: ProjectSettings | null }) {
	const excluded = settings?.excludeColumns?.length ?? 0;

	return (
		<Panel title="Settings" description={settings ? `${settings.targets.length} target variables` : "Not configured"}>
			{settings ? (
				<DataList.Root size="sm" colorPalette="gray">
					<DataList.Item>
						<DataList.ItemLabel>Backend</DataList.ItemLabel>
						<DataList.ItemValue>{settings.backend === "dimx" ? "dimx" : "edmkit"}</DataList.ItemValue>
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
						<DataList.ItemLabel>Excluded</DataList.ItemLabel>
						<DataList.ItemValue>{excluded.toLocaleString()}</DataList.ItemValue>
					</DataList.Item>
					{settings.prefilterThreshold > 0 ? (
						<DataList.Item>
							<DataList.ItemLabel>Pre-filter ρ ≥</DataList.ItemLabel>
							<DataList.ItemValue>{settings.prefilterThreshold.toFixed(2)}</DataList.ItemValue>
						</DataList.Item>
					) : null}
					<DataList.Item>
						<DataList.ItemLabel>Holdout</DataList.ItemLabel>
						<DataList.ItemValue>{formatRange(settings.holdoutRange)}</DataList.ItemValue>
					</DataList.Item>
				</DataList.Root>
			) : (
				<Text color="fg.muted">Choose variable roles and fold ranges to prepare a run.</Text>
			)}
		</Panel>
	);
}

function ResultPanel({ result, status }: { result?: ProjectResult | null; status: RunStatus }) {
	return (
		<Panel title="Results" description={result ? `${result.steps.length} selected variables` : statusLabel(status)}>
			{result ? (
				<DataList.Root size="sm" colorPalette="gray">
					<DataList.Item>
						<DataList.ItemLabel>Best step</DataList.ItemLabel>
						<DataList.ItemValue>{result.bestStep?.stepIndex ?? "-"}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Best holdout rho</DataList.ItemLabel>
						<DataList.ItemValue>{result.bestStep ? result.bestStep.rho.toFixed(3) : "-"}</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item>
						<DataList.ItemLabel>Holdout points</DataList.ItemLabel>
						<DataList.ItemValue>{result.fold.holdoutSize.toLocaleString()}</DataList.ItemValue>
					</DataList.Item>
				</DataList.Root>
			) : (
				<Text color="fg.muted">Results appear after the run completes.</Text>
			)}
		</Panel>
	);
}

function deriveStatus(settings?: ProjectSettings | null, result?: ProjectResult | null): RunStatus {
	if (result) return "completed";
	if (settings) return "running";
	return "draft";
}

function activeStepFor(
	status: RunStatus,
	settings?: ProjectSettings | null,
	result?: ProjectResult | null,
): ProjectWorkflowStepId {
	if (result || status === "completed") return "results";
	if (status === "queued" || status === "running" || status === "failed") return "run";
	if (settings) return "run";
	return "settings";
}

function statusLabel(status: RunStatus) {
	if (status === "draft") return "Not started";
	if (status === "queued") return "Queued";
	if (status === "running") return "Running";
	if (status === "failed") return "Failed";
	return "Completed";
}

function formatRange(range: PointRange) {
	return `${range.start.toLocaleString()} - ${range.end.toLocaleString()}`;
}
