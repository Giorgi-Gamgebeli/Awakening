import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";

type ApiFieldError = Readonly<{
  id: string;
  error: string;
}>;

function isFormField<TForm extends FieldValues>(
  field: string,
  fields: readonly FieldPath<TForm>[],
): field is FieldPath<TForm> {
  return fields.some((allowedField) => allowedField === field);
}

export function applyFieldErrors<TForm extends FieldValues>(
  setError: UseFormSetError<TForm>,
  fieldErrors: readonly ApiFieldError[],
  fields: readonly FieldPath<TForm>[],
) {
  for (const { id, error } of fieldErrors) {
    if (!isFormField(id, fields)) continue;

    setError(id, {
      type: "server",
      message: error,
    });
  }
}
