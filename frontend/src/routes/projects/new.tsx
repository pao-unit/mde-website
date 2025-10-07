import { Box, Button, Center, Field, FileUpload, Stack, Text } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useState } from "react";
import { $api, bodySerializer } from "../../libs/api";

export const Route = createFileRoute("/projects/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	const { mutateAsync: createProject, isPending } = $api.useMutation("post", "/api/projects", {
		onSuccess(data) {
			void navigate({
				to: "/projects/$projectId/settings",
				params: { projectId: data.id },
			});
		},
	});

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!selectedFile) {
			return;
		}
		try {
			await createProject({
				body: { file: selectedFile },
				bodySerializer,
			});
		} catch (_error) {
			// TODO
		}
	};

	return (
		<Center>
			<Box maxW="6xl" px={4} py={8}>
				<form onSubmit={onSubmit}>
					<Box bg="white" borderRadius="xl" boxShadow="sm" p={8} maxW="2xl">
						<Stack gap={6}>
							<Stack gap={1}>
								<Text fontSize="xl" fontWeight="semibold">
									Upload a new dataset
								</Text>
								<Text color="fg.muted">Files are stored per project and converted to compressed Parquet for analysis.</Text>
							</Stack>

							<Field.Root>
								<Field.Label>Data file</Field.Label>
								<FileUpload.Root
									accept={[".csv", ".csv.zstd", ".parquet", ".parquet.zstd"]}
									maxFiles={1}
									onFileChange={(details) => {
										setSelectedFile(details.acceptedFiles[0] ?? null);
									}}
									required
								>
									<FileUpload.HiddenInput />
									{selectedFile ? null : (
										<FileUpload.Dropzone borderWidth="2px" borderStyle="dashed" borderRadius="lg" px={6} py={8} w="full">
											<Stack gap={3} align="center" textAlign="center">
												<Text fontWeight="medium"></Text>
												<Text fontSize="sm" color="fg.muted">
													.csv(.zstd), .parquet(.zstd) up to 1 GB
												</Text>
												<FileUpload.Trigger asChild>
													<Button size="sm" variant="outline">
														Browse files
													</Button>
												</FileUpload.Trigger>
											</Stack>
										</FileUpload.Dropzone>
									)}
									<FileUpload.List showSize clearable />
								</FileUpload.Root>
							</Field.Root>

							<Button type="submit" colorPalette="blue" loading={isPending} disabled={!selectedFile}>
								Continue to settings
							</Button>
						</Stack>
					</Box>
				</form>
			</Box>
		</Center>
	);
}
