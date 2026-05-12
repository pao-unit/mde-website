import { Container, Stack } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { ErrorState } from "../../../components/ui/ErrorState.tsx";
import { PageHeader } from "../../../components/ui/PageHeader.tsx";
import { Panel } from "../../../components/ui/Panel.tsx";
import {
	DEFAULT_ACCEPTED_DATASET_FILE_TYPES,
	NEW_PROJECT_DEFAULT_VALUES,
	createNewProjectSchema,
} from "../-forms/newProjectSchema.ts";
import { useAppForm } from "../-forms/projectForm.tsx";

export interface NewProjectPageProps {
	title?: ReactNode;
	description?: ReactNode;
	onSubmit?: (file: File) => unknown;
	error?: ReactNode;
	acceptedFileTypes?: string[];
	fileHelpText?: ReactNode;
	submitLabel?: string;
	actions?: ReactNode;
}

export function NewProjectPage({
	title = "Upload a new dataset",
	description = "Start with a CSV or Parquet time-series dataset, then configure variables and fold ranges before running analysis.",
	onSubmit,
	error,
	acceptedFileTypes = [...DEFAULT_ACCEPTED_DATASET_FILE_TYPES],
	fileHelpText = ".csv(.zstd), .parquet(.zstd) up to 1 GB",
	submitLabel = "Continue to settings",
	actions,
}: NewProjectPageProps) {
	const form = useAppForm({
		defaultValues: NEW_PROJECT_DEFAULT_VALUES,
		validators: {
			onChange: createNewProjectSchema(acceptedFileTypes),
		},
		onSubmit: async ({ value }) => {
			if (!value.file || !onSubmit) return;
			await onSubmit(value.file);
		},
	});

	return (
		<Container maxW="4xl" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }}>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<Stack gap={6}>
					<PageHeader title={title} description={description} actions={actions} />
					{error ? <ErrorState title="Upload failed" description={error} /> : null}
					<Panel>
						<Stack gap={6}>
							<form.AppField name="file">
								{(field) => (
									<field.DatasetFileField label="Data file" helperText={fileHelpText} acceptedFileTypes={acceptedFileTypes} />
								)}
							</form.AppField>
							<form.AppForm>
								<form.SubmitButton colorPalette="blue" alignSelf="flex-start" requireDirty disabled={!onSubmit}>
									{submitLabel}
								</form.SubmitButton>
							</form.AppForm>
						</Stack>
					</Panel>
				</Stack>
			</form>
		</Container>
	);
}
