import type {
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form";
import { Input } from "./Input";

type FormRowProps<T extends FieldValues> = Readonly<{
  autoComplete?:
    "email" | "username" | "nickname" | "current-password" | "new-password";
  error?: string;
  label: string;
  name: Path<T>;
  placeholder: string;
  register?: UseFormRegister<T>;
  rules?: RegisterOptions<T, Path<T>>;
  type: "email" | "password" | "text";
}>;

export function FormRow<T extends FieldValues = FieldValues>({
  error,
  label,
  name,
  register,
  rules,
  ...inputProps
}: FormRowProps<T>) {
  const registration = register?.(name, rules);

  return (
    <div>
      <label className="grid gap-2 font-mono text-[0.58rem] tracking-[0.14em] text-content-subtle uppercase">
        {label}
        <Input
          {...inputProps}
          name={name}
          inputRef={registration?.ref}
          onBlur={registration?.onBlur}
          onChange={registration?.onChange}
        />
      </label>
      {error ? (
        <p className="mt-1 mb-0 font-mono text-[0.62rem] leading-4 text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
