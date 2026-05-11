import { Button, Container, Field, FileUpload, Stack, Text } from "@chakra-ui/react";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { ErrorState } from "../../../components/ui/ErrorState.tsx";
import { PageHeader } from "../../../components/ui/PageHeader.tsx";
import { Panel } from "../../../components/ui/Panel.tsx";

export interface NewProjectPageProps {
	title?: ReactNode;
	description?: ReactNode;
	selectedFile?: File | null;
	onFileChange?: (file: File | null) => void;
	onSubmit?: (file: File, event: FormEvent<HTMLFormElement>) => void | Promise<void>;
	isSubmitting?: boolean;
	error?: ReactNode;
	acceptedFileTypes?: string[];
	fileHelpText?: ReactNode;
	submitLabel?: string;
	actions?: ReactNode;
}

export function NewProjectPage({
	title = "Upload a new dataset",
	description = "Start with a CSV or Parquet time-series dataset, then configure variables and fold ranges before running analysis.",
	selectedFile,
	onFileChange,
	onSubmit,
	isSubmitting = false,
	error,
	acceptedFileTypes = [".csv", ".csv.zstd", ".parquet", ".parquet.zstd"],
	fileHelpText = ".csv(.zstd), .parquet(.zstd) up to 1 GB",
	submitLabel = "Continue to settings",
	actions,
}: NewProjectPageProps) {
	const [internalFile, setInternalFile] = useState<File | null>(null);
	const isControlled = selectedFile !== undefined;
	const file = isControlled ? selectedFile : internalFile;

	const updateFile = (nextFile: File | null) => {
		if (!isControlled) {
			setInternalFile(nextFile);
		}
		onFileChange?.(nextFile);
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!file || !onSubmit) {
			return;
		}
		void onSubmit(file, event);
	};

	return (
		<Container maxW="4xl" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }}>
			<form onSubmit={handleSubmit}>
				<Stack gap={6}>
					<PageHeader title={title} description={description} actions={actions} />
					{error ? <ErrorState title="Upload failed" description={error} /> : null}
					<Panel>
						<Stack gap={6}>
							<Field.Root required>
								<Field.Label>Data file</Field.Label>
								<FileUpload.Root
									accept={acceptedFileTypes}
									maxFiles={1}
									onFileChange={(details) => updateFile(details.acceptedFiles[0] ?? null)}
									required
								>
									<FileUpload.HiddenInput />
									{file ? null : (
										<FileUpload.Dropzone borderWidth="2px" borderStyle="dashed" borderRadius="8px" px={6} py={8} w="full">
											<Stack gap={3} align="center" textAlign="center">
												<Text fontWeight="medium">Drop a dataset here</Text>
												<Text fontSize="sm" color="fg.muted">
													{fileHelpText}
												</Text>
												<FileUpload.Trigger asChild>
													<Button type="button" size="sm" variant="outline">
														Browse files
													</Button>
												</FileUpload.Trigger>
											</Stack>
										</FileUpload.Dropzone>
									)}
									<FileUpload.List showSize clearable />
								</FileUpload.Root>
							</Field.Root>

							<Button
								type="submit"
								colorPalette="blue"
								alignSelf="flex-start"
								loading={isSubmitting}
								disabled={!file || !onSubmit}
							>
								{submitLabel}
							</Button>
						</Stack>
					</Panel>
				</Stack>
			</form>
		</Container>
	);
}
