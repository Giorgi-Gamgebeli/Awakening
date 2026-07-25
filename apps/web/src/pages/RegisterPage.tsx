import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/Button";
import { FormRow } from "../components/FormRow";
import { MessagePopup } from "../components/MessagePopup";
import { Navigation } from "../components/Navigation";
import SystemWindow from "../components/SystemWindow";

type RegisterFormValues = {
  confirmPassword: string;
  displayName: string;
  email: string;
  password: string;
  username: string;
};

export function RegisterPage() {
  const [authOpen, setAuthOpen] = useState(true);
  const [systemMessageOpen, setSystemMessageOpen] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const navigate = useNavigate();
  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
  } = useForm<RegisterFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const handleRegistered = () => {
    setAuthOpen(false);
  };

  const handleExitComplete = () => {
    if (targetPath) {
      navigate(targetPath);
      return;
    }

    setSystemMessageOpen(true);
  };

  return (
    <main className="relative grid min-h-svh min-w-80 place-items-center overflow-hidden bg-canvas bg-[radial-gradient(circle_at_50%_48%,--alpha(var(--color-system)/7%),transparent_34rem)] px-6 pt-28 pb-6 font-body text-content antialiased [color-scheme:dark] max-[480px]:px-4 max-[480px]:pt-[6.25rem] max-[480px]:pb-4">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,transparent_35%,--alpha(var(--color-canvas)/58%)_100%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <motion.div
          className="h-full w-full rounded-full bg-system/10 blur-[6rem]"
          animate={{ opacity: [0.65, 1, 0.65], scale: [1, 1.35, 1] }}
          transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
        />
      </div>
      <Navigation />
      <SystemWindow
        overlay={false}
        open={authOpen && targetPath === null}
        dismissible={false}
        onExitComplete={handleExitComplete}
      >
        <SystemWindow.Panel>
          <form
            className="pt-7"
            noValidate
            onSubmit={handleSubmit(handleRegistered)}
          >
            <p className="m-0 text-sm leading-6 text-content-muted">
              Create a profile to begin.
            </p>

            <div className="mt-7 grid gap-4">
              <FormRow
                error={errors.username?.message}
                label="Username"
                name="username"
                register={register}
                type="text"
                autoComplete="username"
                placeholder="Username"
                rules={{
                  minLength: {
                    value: 3,
                    message: "Username must have at least 3 characters.",
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: "Use letters, numbers, or underscores only.",
                  },
                  required: "Username is required.",
                }}
              />
              <FormRow
                error={errors.displayName?.message}
                label="Display name"
                name="displayName"
                register={register}
                type="text"
                autoComplete="nickname"
                placeholder="Name friends see"
                rules={{
                  minLength: {
                    value: 2,
                    message: "Display name must have at least 2 characters.",
                  },
                  required: "Display name is required.",
                }}
              />
              <FormRow
                error={errors.email?.message}
                label="Email address"
                name="email"
                register={register}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                rules={{
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: "Enter a valid email address.",
                  },
                  required: "Email address is required.",
                }}
              />
              <FormRow
                error={errors.password?.message}
                label="Password"
                name="password"
                register={register}
                type="password"
                autoComplete="new-password"
                placeholder="Enter password"
                rules={{
                  minLength: {
                    value: 8,
                    message: "Password must have at least 8 characters.",
                  },
                  required: "Password is required.",
                }}
              />
              <FormRow
                error={errors.confirmPassword?.message}
                label="Confirm password"
                name="confirmPassword"
                register={register}
                type="password"
                autoComplete="new-password"
                placeholder="Repeat password"
                rules={{
                  required: "Confirm your password.",
                  validate: (value) =>
                    value === getValues("password") ||
                    "Passwords do not match.",
                }}
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
                onClick={() => setTargetPath("/login")}
              >
                Return to access
              </button>
            </p>
          </form>
        </SystemWindow.Panel>
      </SystemWindow>
      <MessagePopup open={systemMessageOpen} />
    </main>
  );
}
