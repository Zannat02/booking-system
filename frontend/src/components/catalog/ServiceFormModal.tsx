import { useState, type FormEvent } from "react";
import Alert from "../common/Alert";
import FormField from "../common/FormField";
import {
  createService,
  updateService,
  type ServiceInput,
} from "../../services/catalogService";
import type { Category, Service } from "../../types";
import { getErrorMessage } from "../../utils/getErrorMessage";

interface ServiceFormModalProps {
  service: Service | null; // null mane notun service
  categories: Category[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default function ServiceFormModal({
  service,
  categories,
  onClose,
  onSaved,
}: ServiceFormModalProps) {
  const isEdit = service !== null;

  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [categoryId, setCategoryId] = useState(service?.categoryId ?? "");
  const [price, setPrice] = useState(service ? String(service.price) : "");
  const [duration, setDuration] = useState(
    service ? String(service.durationMinutes) : ""
  );
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Notun service-e shudhu active category, edit-e shob (ekhon-er category inactive hote pare)
  const categoryOptions = isEdit
    ? categories
    : categories.filter((category) => category.isActive);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanDescription = description.trim();
    const priceNumber = Number(price);
    const durationNumber = Number(duration);

    if (cleanName.length < 2) {
      setError("Service name must be at least 2 characters.");
      return;
    }
    if (!categoryId) {
      setError("Please select a category.");
      return;
    }
    if (!Number.isInteger(priceNumber) || priceNumber <= 0) {
      setError("Price must be a whole number greater than 0.");
      return;
    }
    if (!Number.isInteger(durationNumber) || durationNumber < 5) {
      setError("Duration must be a whole number of at least 5 minutes.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        const payload: Partial<ServiceInput> = {};
        if (cleanName !== service.name) payload.name = cleanName;
        if (cleanDescription !== (service.description ?? "")) {
          payload.description = cleanDescription;
        }
        if (categoryId !== service.categoryId) payload.categoryId = categoryId;
        if (priceNumber !== service.price) payload.price = priceNumber;
        if (durationNumber !== service.durationMinutes) {
          payload.durationMinutes = durationNumber;
        }
        if (Object.keys(payload).length === 0) {
          setError("No changes to save.");
          setSubmitting(false);
          return;
        }
        await updateService(service.id, payload);
        onSaved("Service updated.");
      } else {
        await createService({
          name: cleanName,
          description: cleanDescription || undefined,
          categoryId,
          price: priceNumber,
          durationMinutes: durationNumber,
          isActive,
        });
        onSaved("Service created.");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Could not save the service."));
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Edit service" : "Create service"}
    >
      <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-extrabold text-slate-900">
          {isEdit ? "Edit service" : "Create service"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <FormField
            id="service-name"
            label="Name"
            placeholder="e.g. AC Servicing"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <div>
            <label
              htmlFor="service-category"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Category
            </label>
            <select
              id="service-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className={fieldClass}
            >
              <option value="">Select a category</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.isActive ? "" : " (inactive)"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="service-price"
              label="Price (BDT)"
              type="number"
              min={1}
              placeholder="1500"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
            <FormField
              id="service-duration"
              label="Duration (minutes)"
              type="number"
              min={5}
              placeholder="60"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="service-description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Description (optional)
            </label>
            <textarea
              id="service-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={fieldClass}
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
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Create service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}