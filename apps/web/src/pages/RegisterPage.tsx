import { motion } from "framer-motion";
import { registerSchema } from "@repo/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { z } from "@repo/zod";
import { Button } from "../components/Button";
import { FormRow } from "../components/FormRow";
import { MessagePopup } from "../components/MessagePopup";
import { Navigation } from "../components/Navigation";
import SystemWindow, {
  type SystemWindowHandle,
} from "../components/SystemWindow";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "../lib/trpc";
import { applyFieldErrors } from "../utils/helper";

export function RegisterPage() {
  const [systemMessageOpen, setSystemMessageOpen] = useState(false);
  const authDialogRef = useRef<SystemWindowHandle>(null);
  const navigate = useNavigate();
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
  const registerMutation = useMutation(trpc.auth.register.mutationOptions());

  async function handleRegister(values: z.infer<typeof registerSchema>) {
    const res = await registerMutation.mutateAsync(values);

    if (!res.ok && "fieldErrors" in res)
      return applyFieldErrors(setError, res.fieldErrors);

    await authDialogRef.current?.close();
    setSystemMessageOpen(true);
  }

  async function goToLogin() {
    await authDialogRef.current?.close();
    navigate("/login");
  }

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
      <SystemWindow ref={authDialogRef} open overlay={false}>
        <form
          className="pt-7"
          noValidate
          onSubmit={handleSubmit(handleRegister)}
        >
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
              onClick={goToLogin}
            >
              Return to access
            </button>
          </p>
        </form>
      </SystemWindow>
      <MessagePopup open={systemMessageOpen} />
    </main>
  );
}
