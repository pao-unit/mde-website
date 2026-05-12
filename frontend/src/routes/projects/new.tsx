import { createFileRoute } from "@tanstack/react-router";
import { NewProjectPage } from "./-components/index.ts";
import { useCreateProject } from "./-hooks/mutations.ts";
import { getErrorMessage } from "../../shared/api/client.ts";

export const Route = createFileRoute("/projects/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();

	const createProject = useCreateProject({
		onSuccess(project) {
			void navigate({
				to: "/projects/$projectId/settings",
				params: { projectId: project.id },
			});
		},
	});

	return (
		<NewProjectPage
			error={createProject.error ? getErrorMessage(createProject.error) : null}
			onSubmit={(file) => createProject.mutateAsync({ file })}
		/>
	);
}
