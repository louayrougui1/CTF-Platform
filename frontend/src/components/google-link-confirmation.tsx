import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";

export function GoogleLinkConfirmation({ email }: { email?: string | undefined }) {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const link = useMutation({
    mutationFn: () => authApi.linkGoogle(),
    onSuccess: (data) => {
      setSession(data.access_token, data.user);
      toast.success("Google account linked.");
      navigate({ to: "/dashboard", replace: true });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <AuthLayout
      title="Link your Google account"
      description={
        email
          ? `An account already exists for ${email}. Link Google to sign in with it from now on.`
          : "An account already exists with this email. Link Google to sign in with it from now on."
      }
    >
      <div className="space-y-3">
        <Button className="w-full" onClick={() => link.mutate()} disabled={link.isPending}>
          {link.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Link Google account
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => navigate({ to: "/login", replace: true })}
        >
          Cancel
        </Button>
      </div>
    </AuthLayout>
  );
}
