import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useState } from "react";
import { ProjectSetupPage, type ProjectWorkflowStepId, type RunStatus } from "../-components/index.ts";
import { useRunAnalysis } from "../-hooks/mutations.ts";
import { getDefaultFoldRanges } from "../-utils/foldRanges.ts";
import type { AnalysisBackend, ColumnSummary, DatasetOverview, ProjectSettings } from "../-utils/model.ts";
import {
	assignVariableRole,
	initSettings,
	sanitizeSettings,
	setBackend,
	validateSettings,
	type VariableRole,
} from "../-utils/settings.ts";
import { $api, getErrorMessage } from "../../../shared/api/client.ts";

export const Route = createFileRoute("/projects/$projectId/settings")({
	validateSearch: (search: Record<string, unknown>): SettingsSearch => ({
		variable: typeof search.variable === "string" && search.variable.trim() ? search.variable : undefined,
	}),
	loaderDeps: ({ search }) => search,
	loader: async ({ context, params, deps }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(
				$api.queryOptions("get", "/api/projects/{project_id}", {
					params: { path: { project_id: params.projectId } },
				}),
			),
			context.queryClient.ensureQueryData(
				$api.queryOptions(
					"get",
					"/api/projects/{project_id}/dataset",
					{ params: { path: { project_id: params.projectId } } },
					{ staleTime: 5 * 60_000 },
				),
			),
			deps.variable
				? context.queryClient.ensureQueryData(
						$api.queryOptions(
							"get",
							"/api/projects/{project_id}/variables",
							{
								params: {
									path: { project_id: params.projectId },
									query: { variables: [deps.variable] },
								},
							},
							{ staleTime: 60_000 },
						),
					)
				: Promise.resolve(),
		]);
	},
	component: SettingsPage,
});

type SettingsNavigate = ReturnType<typeof Route.useNavigate>;
type SettingsSearch = {
	variable?: string;
};

const noop = () => {};

function SettingsPage() {
	const navigate = Route.useNavigate();
	const { projectId } = Route.useParams();
	const { variable } = Route.useSearch();

	const { data: project } = useSuspenseQuery(
		$api.queryOptions("get", "/api/projects/{project_id}", {
			params: { path: { project_id: projectId } },
		}),
	);
	const { data: dataset } = useSuspenseQuery(
		$api.queryOptions(
			"get",
			"/api/projects/{project_id}/dataset",
			{ params: { path: { project_id: projectId } } },
			{ staleTime: 5 * 60_000 },
		),
	);

	const columns = dataset.columns;
	const columnNames = columns.map((column) => column.name);
	const totalPoints = dataset.pointCount;
	const defaultRanges = getDefaultFoldRanges(totalPoints);
	const latestRun = project.latestRun ?? null;
	const latestSettings = latestRun?.settings ?? null;
	const status = latestRun?.status ?? "draft";
	const completedSteps: ProjectWorkflowStepId[] = latestRun?.result ? ["results"] : [];

	const goToStep = (step: ProjectWorkflowStepId) => {
		if (step === "settings") return;
		void navigate({ to: "/projects/$projectId", params: { projectId } });
	};

	if (totalPoints <= 0 || columnNames.length === 0) {
		const settings = initSettings(null, { columnNames, defaultRanges, totalPoints });
		return (
			<ProjectSetupPage
				filename={project.filename}
				dataset={dataset}
				columns={columns}
				settings={settings}
				onSettingsChange={noop}
				onBackendChange={noop}
				onVariableRoleChange={noop}
				totalPoints={totalPoints}
				submitDisabled
				status={status}
				onStepSelect={goToStep}
				completedSteps={completedSteps}
			/>
		);
	}

	return (
		<SettingsForm
			key={`${projectId}:${latestRun?.id ?? "draft"}:${totalPoints}:${columnNames.join("\u0000")}`}
			projectId={projectId}
			columnNames={columnNames}
			columns={columns}
			totalPoints={totalPoints}
			latestSettings={latestSettings}
			filename={project.filename}
			dataset={dataset}
			initialVariable={variable}
			navigate={navigate}
			status={status}
			onStepSelect={goToStep}
			completedSteps={completedSteps}
		/>
	);
}

interface SettingsFormProps {
	projectId: string;
	columnNames: string[];
	columns: ColumnSummary[];
	totalPoints: number;
	latestSettings: ProjectSettings | null;
	filename: string;
	dataset: DatasetOverview;
	initialVariable?: string;
	navigate: SettingsNavigate;
	status: RunStatus;
	onStepSelect: (step: ProjectWorkflowStepId) => void;
	completedSteps: ProjectWorkflowStepId[];
}

function SettingsForm({
	projectId,
	columnNames,
	columns,
	totalPoints,
	latestSettings,
	filename,
	dataset,
	initialVariable,
	navigate,
	status,
	onStepSelect,
	completedSteps,
}: SettingsFormProps) {
	const defaultRanges = getDefaultFoldRanges(totalPoints);
	const settingsOptions = { columnNames, defaultRanges, totalPoints };
	const [settings, setSettings] = useState(() => initSettings(latestSettings, settingsOptions));

	const selectedVariable =
		initialVariable && columnNames.includes(initialVariable) ? initialVariable : (settings.targets[0] ?? columnNames[0] ?? null);
	const selectedVariables = selectedVariable ? [selectedVariable] : [];
	const variablesQuery = useQuery(
		$api.queryOptions(
			"get",
			"/api/projects/{project_id}/variables",
			{
				params: {
					path: { project_id: projectId },
					query: { variables: selectedVariables },
				},
			},
			{
				enabled: selectedVariables.length > 0,
				staleTime: 60_000,
			},
		),
	);

	const runAnalysis = useRunAnalysis(projectId, {
		columnNames,
		defaultRanges,
		totalPoints,
		onSuccess() {
			void navigate({ to: "/projects/$projectId", params: { projectId }, replace: true });
		},
	});

	const commitSettings = (nextSettings: ProjectSettings) => {
		setSettings(sanitizeSettings(nextSettings, settingsOptions));
	};

	const handleBackendChange = (backend: AnalysisBackend) => {
		setSettings((current) => setBackend(current, backend, { columnNames }));
	};

	const handleVariableRoleChange = (column: string, role: VariableRole) => {
		setSettings((current) => assignVariableRole(current, column, role, { columnNames }));
	};

	const handleSelectVariable = (nextVariable: string) => {
		void navigate({
			to: "/projects/$projectId/settings",
			params: { projectId },
			search: { variable: nextVariable },
			replace: true,
		});
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		runAnalysis.mutate(settings);
	};

	const previewSeries = selectedVariable ? (variablesQuery.data?.[selectedVariable] ?? []).filter(isFiniteNumber) : [];
	const previewError = variablesQuery.isError ? getErrorMessage(variablesQuery.error) : null;
	const formError = runAnalysis.error ? getErrorMessage(runAnalysis.error) : null;
	const validationIssues = validateSettings(settings, { columnNames, totalPoints });

	return (
		<ProjectSetupPage
			filename={filename}
			dataset={dataset}
			columns={columns}
			selectedVariable={selectedVariable}
			onSelectVariable={handleSelectVariable}
			previewData={previewSeries}
			isPreviewLoading={variablesQuery.isPending}
			previewError={previewError}
			settings={settings}
			onSettingsChange={commitSettings}
			onBackendChange={handleBackendChange}
			onVariableRoleChange={handleVariableRoleChange}
			totalPoints={totalPoints}
			onSubmit={handleSubmit}
			isSubmitting={runAnalysis.isPending}
			formError={formError}
			submitDisabled={validationIssues.length > 0 || runAnalysis.isPending}
			status={status}
			onStepSelect={onStepSelect}
			completedSteps={completedSteps}
		/>
	);
}

function isFiniteNumber(value: number | null | undefined): value is number {
	return typeof value === "number" && Number.isFinite(value);
}
