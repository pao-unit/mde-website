import * as v from "valibot";

export const DEFAULT_ACCEPTED_DATASET_FILE_TYPES = [".csv", ".csv.zstd", ".parquet", ".parquet.zstd"] as const;

export type NewProjectFormValues = {
	file: File | null;
};

export const NEW_PROJECT_DEFAULT_VALUES: NewProjectFormValues = {
	file: null,
};

export function createNewProjectSchema(acceptedFileTypes: readonly string[] = DEFAULT_ACCEPTED_DATASET_FILE_TYPES) {
	return v.pipe(
		v.object({
			file: v.nullable(v.file("Select a dataset file.")),
		}),
		v.forward(
			v.check((value) => value.file !== null, "Select a dataset file."),
			["file"],
		),
		v.forward(
			v.check(
				(value) => !value.file || isAcceptedDatasetFile(value.file, acceptedFileTypes),
				`Use one of these file types: ${acceptedFileTypes.join(", ")}.`,
			),
			["file"],
		),
	);
}

function isAcceptedDatasetFile(file: File, acceptedFileTypes: readonly string[]): boolean {
	const fileName = file.name.toLowerCase();
	const mimeType = file.type.toLowerCase();

	return acceptedFileTypes.some((acceptedType) => {
		const normalized = acceptedType.toLowerCase();
		if (normalized.startsWith(".")) {
			return fileName.endsWith(normalized);
		}
		return mimeType === normalized;
	});
}
