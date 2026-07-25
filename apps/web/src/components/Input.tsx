import type {
  ChangeEventHandler,
  FocusEventHandler,
  RefCallback,
} from "react";

type InputProps = Readonly<{
  autoComplete?:
    | "email"
    | "username"
    | "nickname"
    | "current-password"
    | "new-password";
  inputRef?: RefCallback<HTMLInputElement>;
  name: string;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  type: "email" | "password" | "text";
}>;

export function Input({ inputRef, ...inputProps }: InputProps) {

  return (
    <input
      className="h-11 w-full border border-content-muted/25 bg-canvas/45 px-3 text-sm text-content outline-none placeholder:text-content-subtle focus:border-system focus:ring-1 focus:ring-system/45"
      ref={inputRef}
      {...inputProps}
    />
  );
}
