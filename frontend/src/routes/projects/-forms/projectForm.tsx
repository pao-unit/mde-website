import { Button, Field, FileUpload, Input, SegmentGroup, Stack, Text } from "@chakra-ui/react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import type { ComponentProps, ReactNode } from "react";
import type { AnalysisBackend } from "../-utils/model.ts";
import { ANALYSIS_BACKENDS, DEFAULT_ANALYSIS_BACKEND } from "../-utils/settings.ts";

export const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

export interface NumberInputFieldProps {
	label: ReactNode;
	helperText?: ReactNode;
	min?: number;
	max?: number;
	step?: number;
}

export function NumberInputField({ label, helperText, min, max, step }: NumberInputFieldProps) {
	const field = useFieldContext<number>();
	const value = Number.isFinite(field.state.value) ? String(field.state.value) : "";
	const errors = getFieldErrorMessages(field);

	return (
		<Field.Root invalid={field.state.meta.isTouched && errors.length > 0}>
			<Field.Label>{label}</Field.Label>
			<Input
				name={field.name}
				type="number"
				min={min}
				max={max}
				step={step}
				value={value}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(parseNumberInput(event.target.value))}
			/>
			{helperText ? <Field.HelperText>{helperText}</Field.HelperText> : null}
			<FieldErrorText field={field} />
		</Field.Root>
	);
}

export function BackendSegmentField() {
	const field = useFieldContext<AnalysisBackend | undefined>();
	const value = field.state.value ?? DEFAULT_ANALYSIS_BACKEND;
	const errors = getFieldErrorMessages(field);

	return (
		<Field.Root invalid={field.state.meta.isTouched && errors.length > 0}>
			<Field.Label>Analysis backend</Field.Label>
			<SegmentGroup.Root
				value={value}
				onValueChange={(details) => {
					if (isAnalysisBackend(details.value)) {
						field.handleChange(details.value);
					}
				}}
				onBlur={field.handleBlur}
			>
				<SegmentGroup.Indicator />
				<SegmentGroup.Items
					items={[
						{ value: "dimx", label: "dimx" },
						{ value: "edmkit", label: "edmkit" },
					]}
				/>
			</SegmentGroup.Root>
			<Field.HelperText>dimx uses the official MDE implementation and accepts one target column.</Field.HelperText>
			<FieldErrorText field={field} />
		</Field.Root>
	);
}

export interface DatasetFileFieldProps {
	label: ReactNode;
	helperText?: ReactNode;
	acceptedFileTypes: string[];
}

export function DatasetFileField({ label, helperText, acceptedFileTypes }: DatasetFileFieldProps) {
	const field = useFieldContext<File | null>();
	const file = field.state.value;
	const files = file ? [file] : [];
	const errors = getFieldErrorMessages(field);

	return (
		<Field.Root required invalid={field.state.meta.isTouched && errors.length > 0}>
			<Field.Label>{label}</Field.Label>
			<FileUpload.Root
				accept={acceptedFileTypes}
				maxFiles={1}
				onFileChange={(details) => {
					field.handleChange(details.acceptedFiles[0] ?? null);
					field.handleBlur();
				}}
				required
			>
				<FileUpload.HiddenInput />
				{file ? null : (
					<FileUpload.Dropzone borderWidth="2px" borderStyle="dashed" borderRadius="8px" px={6} py={8} w="full">
						<Stack gap={3} align="center" textAlign="center">
							<Text fontWeight="medium">Drop a dataset here</Text>
							{helperText ? (
								<Text fontSize="sm" color="fg.muted">
									{helperText}
								</Text>
							) : null}
							<FileUpload.Trigger asChild>
								<Button type="button" size="sm" variant="outline">
									Browse files
								</Button>
							</FileUpload.Trigger>
						</Stack>
					</FileUpload.Dropzone>
				)}
				<FileUpload.List showSize clearable files={files} />
			</FileUpload.Root>
			<FieldErrorText field={field} />
		</Field.Root>
	);
}

interface SubmitButtonProps extends Omit<ComponentProps<typeof Button>, "type"> {
	requireDirty?: boolean;
}

export function SubmitButton({ children, disabled, loading, requireDirty = false, ...buttonProps }: SubmitButtonProps) {
	const form = useFormContext();

	return (
		<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting, state.isPristine] as const}>
			{([canSubmit, isSubmitting, isPristine]) => (
				<Button
					{...buttonProps}
					type="submit"
					loading={loading || isSubmitting}
					disabled={disabled || !canSubmit || (requireDirty && isPristine)}
				>
					{children}
				</Button>
			)}
		</form.Subscribe>
	);
}

export function FieldErrorText({ field }: { field: AnyFieldApi }) {
	const messages = getFieldErrorMessages(field);

	if (!field.state.meta.isTouched || messages.length === 0) {
		return null;
	}

	return <Field.ErrorText>{messages.join(", ")}</Field.ErrorText>;
}

export function getFieldErrorMessages(field: Pick<AnyFieldApi, "state">): string[] {
	return field.state.meta.errors.map(getValidationMessage).filter((message): message is string => Boolean(message));
}

function getValidationMessage(error: unknown): string | null {
	if (typeof error === "string") return error;
	if (error && typeof error === "object" && "message" in error) {
		const message = error.message;
		return typeof message === "string" ? message : null;
	}
	return null;
}

function parseNumberInput(value: string): number {
	if (!value.trim()) return Number.NaN;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function isAnalysisBackend(value: unknown): value is AnalysisBackend {
	return ANALYSIS_BACKENDS.some((backend) => backend === value);
}

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		BackendSegmentField,
		DatasetFileField,
		NumberInputField,
	},
	formComponents: {
		SubmitButton,
	},
});
