import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type z } from "@repo/zod";
import { useForm } from "react-hook-form";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import { Button } from "./Button";
import { FormRow } from "./FormRow";
import { applyFieldErrors } from "../utils/helper";

type LoginFormProps = Readonly<{
  onAuthenticated: () => void;
  onCreateProfile: () => void;
}>;

export default function LoginForm({
  onAuthenticated,
  onCreateProfile,
}: LoginFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<z.infer<typeof loginSchema>>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(loginSchema),
  });

  async function handleAuthenticated(values: z.infer<typeof loginSchema>) {
    try {
      const response = await EmailPassword.signIn({
        formFields: [
          { id: "email", value: values.email },
          { id: "password", value: values.password },
        ],
      });

      if (response.status === "WRONG_CREDENTIALS_ERROR") {
        const message = "Email or password is incorrect.";

        setError("email", { type: "server", message });
        setError("password", { type: "server", message });
        return;
      }

      if (response.status === "FIELD_ERROR") {
        applyFieldErrors(setError, response.formFields, ["email", "password"]);
        return;
      }

      if (response.status === "SIGN_IN_NOT_ALLOWED") {
        applyFieldErrors(
          setError,
          [{ id: "email", error: response.reason }],
          ["email"],
        );
        return;
      }

      if (response.status !== "OK") throw new Error("Something went wrong!");

      onAuthenticated();
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <form
      className="pt-7"
      noValidate
      onSubmit={handleSubmit(handleAuthenticated)}
    >
      <p className="m-0 text-sm leading-6 text-content-muted">
        Identify yourself.
      </p>

      <div className="mt-7 grid gap-4">
        <FormRow
          error={errors.email?.message}
          label="Email address"
          name="email"
          register={register}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <FormRow
          error={errors.password?.message}
          label="Password"
          name="password"
          register={register}
          type="password"
          autoComplete="current-password"
          placeholder="Enter password"
        />
      </div>

      <div className="mt-7">
        <Button type="submit">ENTER</Button>
      </div>

      <p className="mt-6 mb-0 text-center font-mono text-[0.58rem] tracking-[0.09em] text-content-subtle uppercase">
        New to the system?{" "}
        <button
          className="cursor-pointer border-0 bg-transparent p-0 font-inherit text-system hover:text-system-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          type="button"
          onClick={onCreateProfile}
        >
          Create profile
        </button>
      </p>
    </form>
  );
}
