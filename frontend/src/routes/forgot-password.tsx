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

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — CaptureBase" },
      { name: "description", content: "Request a one-time code to reset your CaptureBase password." },
      { property: "og:title", content: "Reset your password — CaptureBase" },
      { property: "og:description", content: "Request a one-time code to reset your password." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");

  const request = useMutation({
    mutationFn: () => authApi.forgotPassword({ email }),
    onSuccess: (data) => {
      toast.success(data?.message ?? "If that email exists, a code is on its way.");
      setStep("code");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const verify = useMutation({
    mutationFn: () => authApi.verifyResetOtp({ email, code }),
    onSuccess: () => {
      toast.success("Code verified. Choose a new password.");
      navigate({ to: "/reset-password" });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <AuthLayout
      title="Forgot your password?"
      description={
        step === "email"
          ? "We'll email you a one-time code."
          : "Enter the code we just emailed you."
      }
      footer={
        <Link to="/login" className="text-muted-foreground hover:text-primary">
          Back to login
        </Link>
      }
    >
      {step === "email" ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            request.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={request.isPending}>
            {request.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Send code
          </Button>
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            verify.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="code">Reset code</Label>
            <Input
              id="code"
              required
              inputMode="numeric"
              className="font-mono tracking-[0.3em]"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={verify.isPending}>
            {verify.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Verify code
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={request.isPending}
            onClick={() => request.mutate()}
          >
            Resend code
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
