import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasStoredToken, useAuthStore } from "../../store/authStore";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";

/**
 * Guards the entire /admin tree. The role check below is UX only — every
 * admin API call is authorised server-side by `requireRole("admin")`.
 */
export function RequireAuth() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const sessionNotice = useAuthStore((s) => s.sessionNotice);
  const revalidate = useAuthStore((s) => s.revalidate);
  const location = useLocation();

  useEffect(() => {
    void revalidate();
  }, [revalidate]);

  // A token restored from storage that the store has not read yet: wait for
  // revalidation instead of bouncing the user to the login page.
  const awaitingStoredSession = status === "guest" && hasStoredToken();

  if (status === "loading" || awaitingStoredSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory px-6">
        <Spinner size={28} label="Checking your session…" />
      </div>
    );
  }

  if (status !== "authed") {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (user && user.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ivory px-6 text-center">
        <span className="eyebrow justify-center">403</span>
        <h1 className="display-heading text-3xl text-forest sm:text-4xl">
          Administrator access only
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-warm-gray">
          Your account does not have permission to open the admin panel. If you believe this is a
          mistake, ask the site owner to check your role.
        </p>
        <Button to="/" variant="outline">
          Back to site
        </Button>
      </div>
    );
  }

  return (
    <>
      {sessionNotice ? (
        <div
          role="status"
          className="border-b border-terracotta/30 bg-terracotta/10 px-6 py-2.5 text-center text-sm text-terracotta-dark"
        >
          {sessionNotice}
        </div>
      ) : null}
      <Outlet />
    </>
  );
}
