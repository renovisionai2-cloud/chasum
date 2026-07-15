"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  FREE_PLAN_LIMIT_MESSAGE,
  FREE_PLAN_UPGRADE_CTA,
} from "@/lib/marketing/pricing";
import Link from "next/link";

type UpgradeToProfessionalModalProps = {
  open: boolean;
  onClose: () => void;
  /** Where the upgrade CTA should send the user (default: Professional signup). */
  upgradeHref?: string;
};

export function UpgradeToProfessionalModal({
  open,
  onClose,
  upgradeHref = "/signup?plan=professional",
}: UpgradeToProfessionalModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Upgrade to Professional"
      description="Unlock more capacity as you grow."
    >
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-foreground">
          {FREE_PLAN_LIMIT_MESSAGE}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Not now
          </Button>
          <Link href={upgradeHref} onClick={onClose}>
            <Button type="button" className="w-full sm:w-auto">
              {FREE_PLAN_UPGRADE_CTA}
            </Button>
          </Link>
        </div>
      </div>
    </Dialog>
  );
}
