import { Button } from "@chakra-ui/react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link as RouterLink } from "@tanstack/react-router";
import { ProjectDashboard, ProjectResultsPage, type ProjectWorkflowStepId } from "../-components/index.ts";
import { deriveProjectWorkflow, isAnalysisActive } from "../-utils/project.ts";
import { $api, getErrorMessage } from "../../../shared/api/client.ts";

export const Route = createFileRoute("/projects/$projectId/")({
	component: ProjectPage,
});

function ProjectPage() {
	const navigate = Route.useNavigate();
	const { projectId } = Route.useParams();

	const projectQuery = useSuspenseQuery(
		$api.queryOptions(
			"get",
			"/api/projects/{project_id}",
			{ params: { path: { project_id: projectId } } },
			{
				refetchInterval(query) {
					const status = deriveProjectWorkflow(query.state.data);
					return isAnalysisActive(status) ? 5_000 : false;
				},
			},
		),
	);

	const datasetQuery = useQuery(
		$api.queryOptions(
			"get",
			"/api/projects/{project_id}/dataset",
			{ params: { path: { project_id: projectId } } },
			{
				staleTime: 5 * 60_000,
			},
		),
	);

	const project = projectQuery.data;
	const latestRun = project.latestRun ?? null;
	const status = deriveProjectWorkflow(project);
	const result = latestRun?.result ?? null;
	const settings = latestRun?.settings ?? null;

	const goToStep = (step: ProjectWorkflowStepId) => {
		if (step === "settings" || step === "dataset") {
			void navigate({ to: "/projects/$projectId/settings", params: { projectId } });
		}
	};

	const configureAction = (
		<Button asChild colorPalette="blue">
			<RouterLink to="/projects/$projectId/settings" params={{ projectId }}>
				{settings ? "Change settings" : "Configure settings"}
			</RouterLink>
		</Button>
	);

	if (result || status === "queued" || status === "running" || status === "failed") {
		return (
			<ProjectResultsPage
				filename={project.filename}
				settings={settings}
				result={result}
				status={status}
				error={status === "failed" ? latestRun?.error : null}
				primaryAction={status === "failed" ? configureAction : undefined}
				secondaryAction={status === "completed" ? configureAction : undefined}
				onStepSelect={goToStep}
			/>
		);
	}

	return (
		<ProjectDashboard
			filename={project.filename}
			dataset={datasetQuery.data}
			settings={settings}
			result={result}
			status={status}
			isLoading={datasetQuery.isPending}
			error={datasetQuery.isError ? getErrorMessage(datasetQuery.error) : null}
			onRetry={() => void datasetQuery.refetch()}
			primaryAction={configureAction}
			onStepSelect={goToStep}
		/>
	);
}
