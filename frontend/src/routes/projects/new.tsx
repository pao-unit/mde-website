import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCreateProject } from "../../features/projects/api/index.ts";
import { NewProjectPage } from "../../features/projects/components/index.ts";
import { getErrorMessage } from "../../shared/api/client.ts";

export const Route = createFileRoute("/projects/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
			selectedFile={selectedFile}
			onFileChange={setSelectedFile}
			isSubmitting={createProject.isPending}
			error={createProject.error ? getErrorMessage(createProject.error) : null}
			onSubmit={(file) => createProject.mutate({ file })}
		/>
	);
}
