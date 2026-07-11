import { cn } from "@/lib/utils";

type ColorPickerProps = {
  name: string;
  colors: readonly string[];
  defaultValue: string;
};

export function ColorPicker({ name, colors, defaultValue }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Choose color">
      {colors.map((color) => (
        <label key={color} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={color}
            defaultChecked={color === defaultValue}
            className="peer sr-only"
          />
          <span
            className={cn(
              "block h-8 w-8 rounded-full border-2 border-transparent peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-checked:border-foreground",
            )}
            style={{ backgroundColor: color }}
          />
        </label>
      ))}
    </div>
  );
}
