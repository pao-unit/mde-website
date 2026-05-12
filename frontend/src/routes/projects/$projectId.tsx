import { createFileRoute, Outlet } from "@tanstack/react-router";
import { $api } from "../../shared/api/client.ts";

export const Route = createFileRoute("/projects/$projectId")({
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(
			$api.queryOptions("get", "/api/projects/{project_id}", {
				params: { path: { project_id: params.projectId } },
			}),
		),
	component: ProjectLayout,
});

function ProjectLayout() {
	return <Outlet />;
}
