import { Grid, Heading, Skeleton, Stack, Text } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import {
	ProjectEmptyState,
	ProjectInProgressState,
	ProjectSettingsSummary,
	ResultPlotPanel,
	ResultTable,
} from "../../../components/projects/index.ts";
import { $api } from "../../../libs/api/index.ts";

export const Route = createFileRoute("/projects/$projectId/")({
	component: ProjectPage,
});

function ProjectPage() {
	const { projectId } = Route.useParams();

	const {
		data: project,
		isPending,
		isError,
	} = $api.useQuery(
		"get",
		"/api/projects/{project_id}",
		{
			params: { path: { project_id: projectId } },
		},
		{
			refetchInterval(query) {
				return query.state.data?.result ? false : 10_000;
			},
		},
	);

	if (isPending) {
		return (
			<Stack gap={6}>
				<Skeleton width="320px" height="32px" borderRadius="md" />
				<Skeleton height="200px" borderRadius="md" />
				<Skeleton height="320px" borderRadius="md" />
			</Stack>
		);
	}

	if (isError || !project) {
		return (
			<Stack gap={3} bg="red.50" borderRadius="lg" borderWidth="1px" borderColor="red.200" p={6}>
				<Text color="red.700">Unable to load project information right now.</Text>
			</Stack>
		);
	}

	if (!project.settings) {
		return <ProjectEmptyState projectId={projectId} filename={project.filename} />;
	}

	if (!project.result) {
		return <ProjectInProgressState projectId={projectId} />;
	}

	return (
		<Stack gap={8}>
			<Stack gap={3}>
				<Heading size="lg">Analysis results</Heading>
				<Text color="fg.muted">
					Review the convergence metrics and embedding performance. You can adjust settings and rerun the analysis at any time.
				</Text>
			</Stack>
			<Grid templateColumns={{ base: "1fr", xl: "320px 1fr" }} gap={8} alignItems="start">
				<ProjectSettingsSummary projectId={projectId} filename={project.filename} settings={project.settings} />
				<Stack gap={6}>
					<ResultPlotPanel result={project.result} />
					<ResultTable result={project.result} />
				</Stack>
			</Grid>
		</Stack>
	);
}
