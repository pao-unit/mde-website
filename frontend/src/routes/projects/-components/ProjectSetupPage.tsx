import type { ReactNode } from "react";
import type { ProjectWorkflowStepId } from "./ProjectLayoutShell.tsx";
import { ProjectLayoutShell } from "./ProjectLayoutShell.tsx";
import type { RunStatus } from "./RunStatusBanner.tsx";
import { RunStatusBanner } from "./RunStatusBanner.tsx";

export interface ProjectSetupPageProps {
	title?: ReactNode;
	description?: ReactNode;
	filename?: string;
	status?: RunStatus;
	headerActions?: ReactNode;
	secondaryAction?: ReactNode;
	onStepSelect?: (step: ProjectWorkflowStepId) => void;
	completedSteps?: ProjectWorkflowStepId[];
	children: ReactNode;
}

export function ProjectSetupPage({
	title = "Configure analysis",
	description = "Assign variables, tune fold ranges, and launch the greedy selection run.",
	filename,
	status = "draft",
	headerActions,
	secondaryAction,
	onStepSelect,
	completedSteps,
	children,
}: ProjectSetupPageProps) {
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
			{children}
		</ProjectLayoutShell>
	);
}
