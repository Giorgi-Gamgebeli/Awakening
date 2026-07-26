import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type z } from "@repo/zod";
import { useForm } from "react-hook-form";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import { Button } from "./Button";
import { FormRow } from "./FormRow";
import { applyFieldErrors } from "../utils/helper";

type RegisterFormProps = Readonly<{
  onRegistered: () => void;
  onReturnToLogin: () => void;
}>;

export default function RegisterForm({
  onRegistered,
  onReturnToLogin,
}: RegisterFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<z.infer<typeof registerSchema>>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(registerSchema),
  });

  async function handleRegister(values: z.infer<typeof registerSchema>) {
    try {
      const response = await EmailPassword.signUp({
        formFields: [
          { id: "email", value: values.email },
          { id: "password", value: values.password },
          { id: "userName", value: values.userName },
          { id: "displayName", value: values.displayName },
        ],
      });

      if (response.status === "FIELD_ERROR") {
        applyFieldErrors(setError, response.formFields, [
          "email",
          "password",
          "userName",
          "displayName",
        ]);
        return;
      }

      if (response.status === "SIGN_UP_NOT_ALLOWED") {
        applyFieldErrors(
          setError,
          [{ id: "email", error: response.reason }],
          ["email"],
        );
        return;
      }

      if (response.status !== "OK") throw new Error("Something went wrong!");
      onRegistered();
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <form className="pt-7" noValidate onSubmit={handleSubmit(handleRegister)}>
      <p className="m-0 text-sm leading-6 text-content-muted">
        Create a profile to begin.
      </p>

      <div className="mt-7 grid gap-4">
        <FormRow
          error={errors.userName?.message}
          label="Username"
          name="userName"
          register={register}
          type="text"
          autoComplete="username"
          placeholder="Username"
        />
        <FormRow
          error={errors.displayName?.message}
          label="Display name"
          name="displayName"
          register={register}
          type="text"
          autoComplete="nickname"
          placeholder="Name friends see"
        />
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
          autoComplete="new-password"
          placeholder="Enter password"
        />
        <FormRow
          error={errors.confirmPassword?.message}
          label="Confirm password"
          name="confirmPassword"
          register={register}
          type="password"
          autoComplete="new-password"
          placeholder="Repeat password"
        />
      </div>

      <div className="mt-7">
        <Button type="submit">CREATE</Button>
      </div>

      <p className="mt-6 mb-0 text-center font-mono text-[0.58rem] tracking-[0.09em] text-content-subtle uppercase">
        Already registered?{" "}
        <button
          className="cursor-pointer border-0 bg-transparent p-0 font-inherit text-system hover:text-system-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          type="button"
          onClick={onReturnToLogin}
        >
          Return to access
        </button>
      </p>
    </form>
  );
}
