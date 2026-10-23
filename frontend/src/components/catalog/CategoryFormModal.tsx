import { useState, type FormEvent } from "react";
import Alert from "../common/Alert";
import FormField from "../common/FormField";
import {
  createCategory,
  updateCategory,
  type CategoryInput,
} from "../../services/catalogService";
import type { Category } from "../../types";
import { getErrorMessage } from "../../utils/getErrorMessage";

interface CategoryFormModalProps {
  category: Category | null; // null mane notun category
  onClose: () => void;
  onSaved: (message: string) => void;
}

export default function CategoryFormModal({
  category,
  onClose,
  onSaved,
}: CategoryFormModalProps) {
  const isEdit = category !== null;

  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanDescription = description.trim();

    if (cleanName.length < 2) {
      setError("Category name must be at least 2 characters.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        const payload: Partial<CategoryInput> = {};
        if (cleanName !== category.name) payload.name = cleanName;
        if (cleanDescription !== (category.description ?? "")) {
          payload.description = cleanDescription;
        }
        if (Object.keys(payload).length === 0) {
          setError("No changes to save.");
          setSubmitting(false);
          return;
        }
        await updateCategory(category.id, payload);
        onSaved("Category updated.");
      } else {
        await createCategory({
          name: cleanName,
          description: cleanDescription || undefined,
          isActive,
        });
        onSaved("Category created.");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Could not save the category."));
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Edit category" : "Create category"}
    >
      <div className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-extrabold text-slate-900">
          {isEdit ? "Edit category" : "Create category"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <FormField
            id="category-name"
            label="Name"
            placeholder="e.g. Home Services"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <div>
            <label
              htmlFor="category-description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Description (optional)
            </label>
            <textarea
              id="category-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          {!isEdit && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Active (visible to customers)
            </label>
          )}

          {error && <Alert type="error" message={error} />}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Create category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}