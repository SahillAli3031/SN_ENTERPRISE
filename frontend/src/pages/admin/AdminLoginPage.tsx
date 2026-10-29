import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BrandMark } from "../../components/layout/BrandMark";
import { Spinner } from "../../components/ui/Spinner";
import { cn } from "../../lib/cn";
import { hasStoredToken, useAuthStore } from "../../store/authStore";

const loginSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LoginLocationState {
  from?: string;
}

const fieldClasses =
  "w-full rounded-[6px] border border-line bg-ivory px-4 py-3 text-sm text-charcoal transition-colors placeholder:text-warm-gray/70 focus:border-forest focus:outline-none";

/** /admin/login — the only public entry point to the admin panel. */
export function AdminLoginPage() {
  const status = useAuthStore((s) => s.status);
  const sessionNotice = useAuthStore((s) => s.sessionNotice);
  const login = useAuthStore((s) => s.login);
  const revalidate = useAuthStore((s) => s.revalidate);
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  // A token restored from storage must be verified before deciding between
  // this form and the dashboard.
  const awaitingStoredSession = status === "guest" && hasStoredToken();

  useEffect(() => {
    void revalidate();
  }, [revalidate]);

  const from = (location.state as LoginLocationState | null)?.from ?? "/admin";

  if (status === "authed") {
    return <Navigate to={from} replace />;
  }

  if (status === "loading" || awaitingStoredSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory px-6">
        <Spinner size={28} label="Checking your session…" />
      </div>
    );
  }

  const onSubmit = async (values: LoginValues) => {
    setSubmitError(null);
    try {
      await login(values.email, values.password);
      // On success the store flips to "authed" and the Navigate above takes over.
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Sign-in failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <BrandMark />
          </div>

          <div className="rounded-[8px] border border-line bg-soft-white p-7 shadow-soft sm:p-9">
            <span className="eyebrow">Administration</span>
            <h1 className="display-heading mt-4 text-3xl text-forest">Administrator Sign In</h1>
            <p className="mt-3 text-sm leading-relaxed text-warm-gray">
              Sign in with your admin account to moderate reviews and manage site content.
            </p>

            {sessionNotice ? (
              <p
                role="status"
                className="mt-5 rounded-[6px] border border-terracotta/35 bg-terracotta/10 px-4 py-3 text-sm text-terracotta-dark"
              >
                {sessionNotice}
              </p>
            ) : null}

            {submitError ? (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-[6px] border border-terracotta/40 bg-terracotta/10 p-4 text-sm text-terracotta-dark"
              >
                <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{submitError}</span>
              </div>
            ) : null}

            <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div>
                <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-charcoal">
                  Email address
                </label>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  className={cn(fieldClasses, errors.email && "border-terracotta")}
                  aria-invalid={errors.email ? true : undefined}
                  {...register("email")}
                />
                {errors.email ? (
                  <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-sm font-medium text-charcoal"
                >
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  className={cn(fieldClasses, errors.password && "border-terracotta")}
                  aria-invalid={errors.password ? true : undefined}
                  {...register("password")}
                />
                {errors.password ? (
                  <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-forest px-8 py-3.5 text-[0.75rem] font-semibold tracking-[0.18em] text-ivory uppercase transition-colors hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Spinner size={16} label="Signing in…" /> : "Sign In"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-warm-gray">
            <Link
              to="/"
              className="font-medium text-forest underline-offset-4 transition-colors hover:text-terracotta hover:underline"
            >
              Back to the website
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
