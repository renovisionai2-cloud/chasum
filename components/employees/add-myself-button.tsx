"use client";

import { Button } from "@/components/ui/button";
import { ensureOwnerAsBookableStaff } from "@/lib/actions/onboarding";
import { useToast } from "@/providers/toast-provider";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function AddMyselfAsProviderButton() {
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        start(async () => {
          const result = await ensureOwnerAsBookableStaff();
          if (result.error) toast(result.error, "error");
          else {
            toast(result.success ?? "Added.", "success");
            router.refresh();
          }
        });
      }}
    >
      <UserPlus className="h-4 w-4" aria-hidden />
      {pending ? "Adding…" : "Add myself as provider"}
    </Button>
  );
}
