import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { userApi } from "@/api/user";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { ErrorState, LoadingBlock, PageHeader } from "@/components/ui-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — CaptureBase" },
      { name: "description", content: "Manage your CaptureBase username, password and Google link." },
      { property: "og:title", content: "Your profile — CaptureBase" },
      { property: "og:description", content: "Manage your username, password and Google link." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  ),
});

function ProfilePage() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const profile = useQuery({ queryKey: ["user", "profile"], queryFn: userApi.profile });

  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (profile.data) setUsername(profile.data.username);
  }, [profile.data]);

  const updateProfile = useMutation({
    mutationFn: () => userApi.updateProfile({ username }),
    onSuccess: (data) => {
      toast.success("Profile updated.");
      setUser({ ...(useAuthStore.getState().user ?? {}), ...data } as never);
      void queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const setPassword = useMutation({
    mutationFn: () => authApi.setPassword({ newPassword }),
    onSuccess: (data) => {
      toast.success(data?.message ?? "Password set.");
      setNewPassword("");
      setConfirmPassword("");
      void queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="Your identity across every event you play or organise."
      />

      {profile.isLoading ? (
        <LoadingBlock />
      ) : profile.isError ? (
        <ErrorState message={apiErrorMessage(profile.error)} onRetry={() => profile.refetch()} />
      ) : profile.data ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="surface-card space-y-4 p-6">
            <h2 className="font-display text-lg font-semibold">Details</h2>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.data.email} readOnly className="bg-muted" />
            </div>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                updateProfile.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={updateProfile.isPending || username === profile.data.username}
              >
                {updateProfile.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                Save changes
              </Button>
            </form>
          </section>

          <section className="surface-card space-y-4 p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <KeyRound className="size-4 text-primary" aria-hidden />
              {profile.data.hasPassword ? "Change password" : "Set a password"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {profile.data.hasPassword
                ? "Choose a new password for email + password login."
                : "You signed up with Google. Add a password to log in without it."}
            </p>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (newPassword !== confirmPassword) {
                  toast.error("Passwords do not match.");
                  return;
                }
                setPassword.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={setPassword.isPending}>
                {setPassword.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                Save password
              </Button>
            </form>

            <div className="border-t border-border pt-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="size-4 text-primary" aria-hidden />
                Google account
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {profile.data.googleId
                  ? "Your Google account is linked."
                  : "Link Google to sign in with one click."}
              </p>
              {profile.data.googleId ? null : (
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    window.location.href = authApi.googleLoginUrl();
                  }}
                >
                  Link Google account
                </Button>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
