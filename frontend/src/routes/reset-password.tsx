import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api-client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — CaptureBase" },
      { name: "description", content: "Set a new password for your CaptureBase account." },
      { property: "og:title", content: "Choose a new password — CaptureBase" },
      { property: "og:description", content: "Set a new password for your CaptureBase account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const reset = useMutation({
    mutationFn: () => authApi.resetPassword({ newPassword }),
    onSuccess: () => {
      toast.success("Password updated. Log in with your new password.");
      navigate({ to: "/login", replace: true });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const mismatch = confirm.length > 0 && confirm !== newPassword;

  return (
    <AuthLayout
      title="Set a new password"
      description="Your reset code has been verified — choose a new password."
      footer={
        <Link to="/login" className="text-muted-foreground hover:text-primary">
          Back to login
        </Link>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (mismatch) return;
          reset.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {mismatch ? <p className="text-xs text-destructive">Passwords don't match.</p> : null}
        </div>
        <Button type="submit" className="w-full" disabled={reset.isPending || mismatch}>
          {reset.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
