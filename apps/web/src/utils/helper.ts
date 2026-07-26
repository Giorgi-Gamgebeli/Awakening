import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";

export function applyFieldErrors<TForm extends FieldValues>(
  setError: UseFormSetError<TForm>,
  fieldErrors: Partial<Record<FieldPath<TForm>, string>>,
) {
  for (const [field, message] of Object.entries(fieldErrors) as [
    FieldPath<TForm>,
    string,
  ][]) {
    setError(field, {
      message,
    });
  }
}
