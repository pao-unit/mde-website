import { Badge, Flex, Spinner, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { Panel } from "../../../components/ui/Panel.tsx";

export type RunStatus = "draft" | "queued" | "running" | "failed" | "completed";

export interface RunStatusBannerProps {
	status: RunStatus;
	title?: ReactNode;
	description?: ReactNode;
	errorMessage?: ReactNode;
	progressLabel?: ReactNode;
	primaryAction?: ReactNode;
	secondaryAction?: ReactNode;
}

const STATUS_COPY: Record<
	RunStatus,
	{
		label: string;
		title: string;
		description: string;
		colorPalette: "gray" | "yellow" | "blue" | "red" | "green";
		borderColor: string;
		bg: string;
	}
> = {
	draft: {
		label: "Draft",
		title: "Configure settings before running",
		description: "Choose targets, candidate variables, fold ranges, and reproducibility settings.",
		colorPalette: "gray",
		borderColor: "gray.200",
		bg: "white",
	},
	queued: {
		label: "Queued",
		title: "Run queued",
		description: "The analysis will start when a worker is available.",
		colorPalette: "yellow",
		borderColor: "yellow.200",
		bg: "yellow.50",
	},
	running: {
		label: "Running",
		title: "Analysis in progress",
		description: "Greedy variable selection is running. Results will appear when the run completes.",
		colorPalette: "blue",
		borderColor: "blue.200",
		bg: "blue.50",
	},
	failed: {
		label: "Failed",
		title: "Run failed",
		description: "Review the error and adjust the dataset or settings before retrying.",
		colorPalette: "red",
		borderColor: "red.200",
		bg: "red.50",
	},
	completed: {
		label: "Completed",
		title: "Results ready",
		description: "Review selected variables, prediction skill, and actual-vs-predicted holdout plots.",
		colorPalette: "green",
		borderColor: "green.200",
		bg: "green.50",
	},
};

export function RunStatusBanner({
	status,
	title,
	description,
	errorMessage,
	progressLabel,
	primaryAction,
	secondaryAction,
}: RunStatusBannerProps) {
	const copy = STATUS_COPY[status];
	const isBusy = status === "queued" || status === "running";
	const body = description ?? (status === "failed" && errorMessage ? errorMessage : copy.description);

	return (
		<Panel bg={copy.bg} borderColor={copy.borderColor} p={{ base: 4, md: 5 }}>
			<Flex gap={4} align={{ base: "stretch", md: "center" }} justify="space-between" direction={{ base: "column", md: "row" }}>
				<Stack gap={2} minW={0}>
					<Stack direction="row" gap={3} align="center" wrap="wrap">
						<Badge colorPalette={copy.colorPalette}>{copy.label}</Badge>
						{isBusy ? (
							<Stack direction="row" gap={2} align="center" color="fg.muted" fontSize="sm">
								<Spinner size="xs" />
								<Text>{progressLabel ?? "Waiting for run state updates"}</Text>
							</Stack>
						) : null}
					</Stack>
					<Stack gap={1}>
						<Text fontWeight="semibold" color={status === "failed" ? "red.800" : "fg"}>
							{title ?? copy.title}
						</Text>
						<Text color={status === "failed" ? "red.700" : "fg.muted"}>{body}</Text>
					</Stack>
				</Stack>
				{primaryAction || secondaryAction ? (
					<Flex gap={2} align="center" justify={{ base: "flex-start", md: "flex-end" }} shrink={0} wrap="wrap">
						{secondaryAction}
						{primaryAction}
					</Flex>
				) : null}
			</Flex>
		</Panel>
	);
}
