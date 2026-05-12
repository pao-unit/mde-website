import { Box, Button, Container, Grid, GridItem, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { PageHeader } from "../../../components/ui/PageHeader.tsx";

export type ProjectWorkflowStepId = "dataset" | "settings" | "run" | "results";

export interface ProjectWorkflowStep {
	id: ProjectWorkflowStepId;
	label: string;
	description?: string;
	disabled?: boolean;
}

export interface ProjectLayoutShellProps {
	title: ReactNode;
	description?: ReactNode;
	eyebrow?: ReactNode;
	meta?: ReactNode;
	actions?: ReactNode;
	activeStep: ProjectWorkflowStepId;
	steps?: ProjectWorkflowStep[];
	onStepSelect?: (step: ProjectWorkflowStepId) => void;
	completedSteps?: ProjectWorkflowStepId[];
	statusBanner?: ReactNode;
	sidebar?: ReactNode;
	children: ReactNode;
	maxW?: string;
}

const DEFAULT_STEPS: ProjectWorkflowStep[] = [
	{ id: "dataset", label: "Dataset", description: "Upload and inspect variables" },
	{ id: "settings", label: "Settings", description: "Choose roles and folds" },
	{ id: "run", label: "Run", description: "Launch selection" },
	{ id: "results", label: "Results", description: "Review holdout skill" },
];

export function ProjectLayoutShell({
	title,
	description,
	eyebrow,
	meta,
	actions,
	activeStep,
	steps = DEFAULT_STEPS,
	onStepSelect,
	completedSteps,
	statusBanner,
	sidebar,
	children,
	maxW = "7xl",
}: ProjectLayoutShellProps) {
	return (
		<Box flex="1" minH={0} overflowY="auto">
			<Container maxW={maxW} py={{ base: 6, md: 8 }} px={{ base: 4, md: 6 }}>
				<Stack gap={6}>
					<PageHeader eyebrow={eyebrow} title={title} description={description} meta={meta} actions={actions} />
					<WorkflowSteps steps={steps} activeStep={activeStep} onStepSelect={onStepSelect} completedSteps={completedSteps} />
					{statusBanner}
					{sidebar ? (
						<Grid templateColumns={{ base: "1fr", xl: "320px minmax(0, 1fr)" }} gap={6} alignItems="start">
							<GridItem minW={0}>{sidebar}</GridItem>
							<GridItem minW={0}>{children}</GridItem>
						</Grid>
					) : (
						children
					)}
				</Stack>
			</Container>
		</Box>
	);
}

function WorkflowSteps({
	steps,
	activeStep,
	onStepSelect,
	completedSteps,
}: {
	steps: ProjectWorkflowStep[];
	activeStep: ProjectWorkflowStepId;
	onStepSelect?: (step: ProjectWorkflowStepId) => void;
	completedSteps?: ProjectWorkflowStepId[];
}) {
	const activeIndex = Math.max(
		0,
		steps.findIndex((step) => step.id === activeStep),
	);

	return (
		<Grid
			role="list"
			aria-label="Project workflow"
			templateColumns={{ base: "1fr", md: `repeat(${steps.length}, minmax(0, 1fr))` }}
			gap={2}
		>
			{steps.map((step, index) => {
				const isCurrent = index === activeIndex;
				const isComplete = !isCurrent && (index < activeIndex || completedSteps?.includes(step.id));
				const state = isCurrent ? "current" : isComplete ? "complete" : "pending";
				const isClickable = Boolean(onStepSelect && !step.disabled);
				const content = <StepContent step={step} state={state} />;

				const borderColor = state === "current" ? "blue.300" : state === "complete" ? "green.200" : "gray.200";
				const bg = state === "current" ? "blue.50" : state === "complete" ? "green.50" : "white";

				if (isClickable) {
					return (
						<Button
							key={step.id}
							type="button"
							role="listitem"
							variant="ghost"
							h="auto"
							minH="72px"
							justifyContent="flex-start"
							textAlign="left"
							whiteSpace="normal"
							borderWidth="1px"
							borderRadius="8px"
							borderColor={borderColor}
							bg={bg}
							aria-current={state === "current" ? "step" : undefined}
							onClick={() => onStepSelect?.(step.id)}
						>
							{content}
						</Button>
					);
				}

				return (
					<Box
						key={step.id}
						role="listitem"
						minH="72px"
						borderWidth="1px"
						borderRadius="8px"
						borderColor={borderColor}
						bg={bg}
						p={3}
						aria-current={state === "current" ? "step" : undefined}
					>
						{content}
					</Box>
				);
			})}
		</Grid>
	);
}

function StepContent({ step, state }: { step: ProjectWorkflowStep; state: "complete" | "current" | "pending" }) {
	const dotColor = state === "complete" ? "green.500" : state === "current" ? "blue.500" : "gray.300";

	return (
		<Stack direction="row" gap={3} align="flex-start" w="full">
			<Box w="10px" h="10px" borderRadius="full" bg={dotColor} mt="6px" flexShrink={0} />
			<Stack gap={1} minW={0}>
				<Text fontWeight="semibold" color="fg">
					{step.label}
				</Text>
				{step.description ? (
					<Text fontSize="sm" color="fg.muted">
						{step.description}
					</Text>
				) : null}
			</Stack>
		</Stack>
	);
}
