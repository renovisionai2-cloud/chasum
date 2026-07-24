"use client";

import { DesignPartnerForm } from "@/components/landing/design-partner-form";
import { Reveal } from "@/components/landing/reveal";
import { SummerOrb } from "@/components/marketing/flagship-summer/summer-orb";
import { FS_ALPHA } from "@/lib/marketing/flagship-summer";
import { PRIVATE_ALPHA_HREF } from "@/lib/marketing/alpha";
import Link from "next/link";

export function FlagshipAlpha() {
  return (
    <section
      id="private-alpha"
      className="fs-scene fs-alpha scroll-mt-24"
      aria-labelledby="fs-alpha-title"
    >
      <div className="fs-alpha-layout">
        <Reveal>
          <div className="fs-alpha-invite">
            <SummerOrb size="lg" active />
            <p className="fs-scene-kicker mt-8">Private Alpha</p>
            <h2 id="fs-alpha-title" className="fs-scene-title">
              {FS_ALPHA.title}
            </h2>
            <p className="fs-scene-lede">{FS_ALPHA.body}</p>
            <p className="mt-4 text-sm text-white/45">
              Prefer context?{" "}
              <Link
                href={PRIVATE_ALPHA_HREF}
                className="text-sky-300 hover:underline"
              >
                Why Private Alpha?
              </Link>
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={90}>
          <div className="fs-alpha-form">
            <div className="fs-alpha-nebula" aria-hidden />
            <div className="relative">
              <p className="mb-5 text-sm font-medium text-white/70">
                {FS_ALPHA.cta}
              </p>
              <DesignPartnerForm />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
