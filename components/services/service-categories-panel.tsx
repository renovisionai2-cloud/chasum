"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/color-picker";
import { Dialog } from "@/components/ui/dialog";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/page-header";
import {
  confirmDelete,
  useFormAction,
  useRefresh,
} from "@/hooks/use-form-action";
import {
  deleteServiceCategory,
  reorderServiceCategories,
  upsertServiceCategory,
} from "@/lib/actions/business-management";
import type { ServiceCategory } from "@/lib/business/types";
import type { ActionState } from "@/lib/types/booking";
import { SERVICE_CATEGORY_PRESETS, SERVICE_COLORS } from "@/lib/types/booking";
import { useToast } from "@/providers/toast-provider";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState, useTransition } from "react";

const ICON_OPTIONS = [
  "layers",
  "stethoscope",
  "sparkles",
  "scissors",
  "wrench",
  "camera",
  "sparkle",
  "heart",
  "star",
  "car",
];

function CategoryForm({
  category,
  onClose,
  nextSortOrder,
}: {
  category?: ServiceCategory;
  onClose: () => void;
  nextSortOrder: number;
}) {
  const [state, formAction, pending] = useActionState(
    upsertServiceCategory,
    {} as ActionState,
  );
  useFormAction(state, undefined, onClose);

  return (
    <form action={formAction} className="space-y-4">
      {category && <input type="hidden" name="id" value={category.id} />}
      <input
        type="hidden"
        name="sort_order"
        value={category?.sort_order ?? nextSortOrder}
      />
      <div className="space-y-2">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          name="name"
          required
          defaultValue={category?.name ?? ""}
          list="category-presets"
        />
        <datalist id="category-presets">
          {SERVICE_CATEGORY_PRESETS.map((preset) => (
            <option key={preset.name} value={preset.name} />
          ))}
        </datalist>
      </div>
      <div className="space-y-2">
        <Label htmlFor="category-description">Description</Label>
        <Textarea
          id="category-description"
          name="description"
          rows={2}
          defaultValue={category?.description ?? ""}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category-icon">Icon</Label>
          <Select
            id="category-icon"
            name="icon"
            defaultValue={category?.icon ?? "layers"}
          >
            {ICON_OPTIONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Color</Label>
          <ColorPicker
            name="color"
            colors={SERVICE_COLORS}
            defaultValue={category?.color ?? SERVICE_COLORS[5]}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          value="true"
          defaultChecked={category?.is_active ?? true}
        />
        Active
      </label>
      <AlertMessage error={state.error} />
      <FormFooter
        onCancel={onClose}
        pending={pending}
        submitLabel={category ? "Update" : "Create"}
      />
    </form>
  );
}

export function ServiceCategoriesPanel({
  categories,
}: {
  categories: ServiceCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCategory | undefined>();
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const refresh = useRefresh();
  const { toast } = useToast();

  const ordered = useMemo(() => {
    if (!localOrder) return categories;
    const byId = new Map(categories.map((c) => [c.id, c]));
    const fromLocal = localOrder
      .map((id) => byId.get(id))
      .filter(Boolean) as ServiceCategory[];
    const missing = categories.filter((c) => !localOrder.includes(c.id));
    return [...fromLocal, ...missing];
  }, [categories, localOrder]);

  async function handleDelete(id: string, name: string) {
    if (!(await confirmDelete(`Delete category ${name}?`))) return;
    const result = await deleteServiceCategory(id);
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Category deleted.", "success");
      refresh();
    }
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const current = ordered;
    const from = current.findIndex((c) => c.id === dragId);
    const to = current.findIndex((c) => c.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...current];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setLocalOrder(next.map((c) => c.id));
    setDragId(null);
    startTransition(async () => {
      const result = await reorderServiceCategories(next.map((c) => c.id));
      if (result.error) toast(result.error, "error");
      else {
        toast(result.success ?? "Order updated.", "success");
        refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Categories</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize services. Drag to reorder.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Add category
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {ordered.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Add categories like Medical, Massage, or Hair."
          >
            <Button
              type="button"
              onClick={() => {
                setEditing(undefined);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add category
            </Button>
          </EmptyState>
        ) : (
          <ul className="space-y-2" aria-label="Service categories">
            {ordered.map((category) => (
              <li
                key={category.id}
                draggable
                onDragStart={() => setDragId(category.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => onDrop(category.id)}
                className={`flex items-center gap-3 rounded-[var(--radius-sm)] border border-border/60 bg-background px-3 py-2 ${
                  pending ? "opacity-70" : ""
                }`}
              >
                <button
                  type="button"
                  className="cursor-grab text-muted-foreground active:cursor-grabbing"
                  aria-label={`Drag ${category.name}`}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{category.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {category.icon ?? "layers"}
                    {!category.is_active ? " · Inactive" : ""}
                  </p>
                </div>
                <IconButton
                  label={`Edit ${category.name}`}
                  onClick={() => {
                    setEditing(category);
                    setOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label={`Delete ${category.name}`}
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(category.id, category.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit category" : "New category"}
      >
        <CategoryForm
          category={editing}
          onClose={() => setOpen(false)}
          nextSortOrder={ordered.length}
        />
      </Dialog>
    </Card>
  );
}
