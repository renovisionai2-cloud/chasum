"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadBusinessAsset } from "@/lib/actions/uploads";
import { cn } from "@/lib/utils";
import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

type ImageUploadFieldProps = {
  id: string;
  name: string;
  label: string;
  folder: string;
  defaultValue?: string | null;
  accept?: string;
  hint?: string;
  previewClassName?: string;
};

export function ImageUploadField({
  id,
  name,
  label,
  folder,
  defaultValue,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  hint = "Upload JPG, PNG, or WebP up to 5 MB.",
  previewClassName,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("folder", folder);
    const result = await uploadBusinessAsset(formData);
    setUploading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.url) setUrl(result.url);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {url ? (
          <div
            className={cn(
              "flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted sm:w-32",
              previewClassName,
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          <input type="hidden" name={name} value={url} />
          <Input
            id={id}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://… or upload below"
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => void handleFileChange(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="h-4 w-4" aria-hidden="true" />
              )}
              {uploading ? "Uploading…" : "Upload file"}
            </Button>
            {url && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUrl("")}
              >
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
