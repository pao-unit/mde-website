import { Grid, Stack, Text } from "@chakra-ui/react";
import { useStore } from "@tanstack/react-form";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	ProjectSettingsFormFields,
	ProjectSetupPage,
	VariableRoleTable,
	type ProjectWorkflowStepId,
	type RunStatus,
} from "../-components/index.ts";
import { createAnalysisSettingsSchema } from "../-forms/settingsSchema.ts";
import { useAppForm } from "../-forms/projectForm.tsx";
import { useRunAnalysis } from "../-hooks/mutations.ts";
import { getDefaultFoldRanges } from "../-utils/foldRanges.ts";
import type { ColumnSummary, ProjectSettings } from "../-utils/model.ts";
import { initSettings } from "../-utils/settings.ts";
import { Panel } from "../../../components/ui/Panel.tsx";
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
			<ProjectSetupPage filename={project.filename} status={status} onStepSelect={goToStep} completedSteps={completedSteps}>
				<SettingsUnavailableContent columns={columns} settings={settings} />
			</ProjectSetupPage>
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
	initialVariable,
	navigate,
	status,
	onStepSelect,
	completedSteps,
}: SettingsFormProps) {
	const defaultRanges = getDefaultFoldRanges(totalPoints);
	const settingsOptions = { columnNames, defaultRanges, totalPoints };
	const runAnalysis = useRunAnalysis(projectId, {
		columnNames,
		defaultRanges,
		totalPoints,
		onSuccess() {
			void navigate({ to: "/projects/$projectId", params: { projectId }, replace: true });
		},
	});
	const form = useAppForm({
		defaultValues: initSettings(latestSettings, settingsOptions),
		validators: {
			onChange: createAnalysisSettingsSchema({ columnNames, totalPoints }),
		},
		onSubmit: async ({ value }) => {
			await runAnalysis.mutateAsync(value);
		},
	});
	const targets = useStore(form.store, (state) => state.values.targets);

	const selectedVariable =
		initialVariable && columnNames.includes(initialVariable) ? initialVariable : (targets[0] ?? columnNames[0] ?? null);
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

	const handleSelectVariable = (nextVariable: string) => {
		void navigate({
			to: "/projects/$projectId/settings",
			params: { projectId },
			search: { variable: nextVariable },
			replace: true,
		});
	};

	const previewSeries = selectedVariable ? (variablesQuery.data?.[selectedVariable] ?? []).filter(isFiniteNumber) : [];
	const previewError = variablesQuery.isError ? getErrorMessage(variablesQuery.error) : null;
	const formError = runAnalysis.error ? getErrorMessage(runAnalysis.error) : null;

	return (
		<ProjectSetupPage filename={filename} status={status} onStepSelect={onStepSelect} completedSteps={completedSteps}>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<ProjectSettingsFormFields
					form={form}
					columns={columns}
					columnNames={columnNames}
					selectedVariable={selectedVariable}
					onSelectVariable={handleSelectVariable}
					previewData={previewSeries}
					isPreviewLoading={variablesQuery.isPending}
					previewError={previewError}
					totalPoints={totalPoints}
					runError={formError}
				/>
			</form>
		</ProjectSetupPage>
	);
}

function SettingsUnavailableContent({ columns, settings }: { columns: ColumnSummary[]; settings: ProjectSettings }) {
	return (
		<Grid templateColumns={{ base: "1fr", xl: "minmax(0, 1fr) 380px" }} gap={6} alignItems="start">
			<VariableRoleTable columns={columns} settings={settings} onRoleChange={noop} />
			<Panel>
				<Stack gap={2}>
					<Text fontWeight="semibold">Dataset is not ready for analysis</Text>
					<Text color="fg.muted">Analysis settings require at least one variable and one data point.</Text>
				</Stack>
			</Panel>
		</Grid>
	);
}

function isFiniteNumber(value: number | null | undefined): value is number {
	return typeof value === "number" && Number.isFinite(value);
}
