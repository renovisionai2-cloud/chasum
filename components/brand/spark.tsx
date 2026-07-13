import { BRAND_ASSETS } from "@/lib/brand/assets";
import { cn } from "@/lib/utils";
import Image from "next/image";

type SparkProps = {
  className?: string;
  /** Pixel size (square). */
  size?: number;
  /** Soft glow / pulse for AI moments. Honors prefers-reduced-motion. */
  animate?: boolean;
  priority?: boolean;
  title?: string;
};

/**
 * Official AI Spark — Brand V1.0.
 * Use only for AI-powered features. Never as a logo substitute.
 */
export function Spark({
  className,
  size = 20,
  animate = false,
  priority = false,
  title = "Chasum AI",
}: SparkProps) {
  return (
    <Image
      src={BRAND_ASSETS.spark}
      alt={title}
      width={size}
      height={size}
      className={cn(
        "shrink-0 object-contain",
        animate && "animate-spark-pulse",
        className,
      )}
      priority={priority}
      unoptimized
    />
  );
}
