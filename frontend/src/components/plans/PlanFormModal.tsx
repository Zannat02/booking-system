import { useState, type FormEvent } from "react";
import Alert from "../common/Alert";
import FormField from "../common/FormField";
import {
  createPlan,
  updatePlan,
  type PlanInput,
} from "../../services/planService";
import type { Plan, Service } from "../../types";
import { formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

interface PlanFormModalProps {
  plan: Plan | null; // null mane notun plan
  services: Service[]; // shudhu active service
  onClose: () => void;
  onSaved: (message: string) => void;
}

interface ServiceOption {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default function PlanFormModal({
  plan,
  services,
  onClose,
  onSaved,
}: PlanFormModalProps) {
  const isEdit = plan !== null;

  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [price, setPrice] = useState(plan ? String(plan.price) : "");
  const [durationDays, setDurationDays] = useState(plan ? String(plan.durationDays) : "");
  const [credits, setCredits] = useState(plan ? String(plan.credits) : "");
  const [selected, setSelected] = useState<string[]>(
    plan?.services.map((service) => service.id) ?? []
  );
  const [serviceSearch, setServiceSearch] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Active service-gulo + plan-er ekhon-er service (inactive hole-o, jate uncheck kora jay)
  const options: ServiceOption[] = [
    ...services.map((service) => ({
      id: service.id,
      name: service.name,
      price: service.price,
      isActive: true,
    })),
    ...(plan
      ? plan.services
          .filter((item) => !services.some((service) => service.id === item.id))
          .map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            isActive: item.isActive,
          }))
      : []),
  ];

  const visibleOptions = options.filter((option) =>
    option.name.toLowerCase().includes(serviceSearch.trim().toLowerCase())
  );

  const toggleService = (id: string) => {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanDescription = description.trim();
    const priceNumber = Number(price);
    const daysNumber = Number(durationDays);
    const creditsNumber = Number(credits);

    if (cleanName.length < 2) {
      setError("Plan name must be at least 2 characters.");
      return;
    }
    if (!Number.isInteger(priceNumber) || priceNumber <= 0) {
      setError("Price must be a whole number greater than 0.");
      return;
    }
    if (!Number.isInteger(daysNumber) || daysNumber < 1) {
      setError("Duration must be a whole number of at least 1 day.");
      return;
    }
    if (!Number.isInteger(creditsNumber) || creditsNumber < 1) {
      setError("Credits must be a whole number of at least 1.");
      return;
    }
    if (selected.length === 0) {
      setError("A plan must include at least one service.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        const originalIds = plan.services.map((service) => service.id);
        const servicesChanged =
          selected.length !== originalIds.length ||
          selected.some((id) => !originalIds.includes(id));

      
          
        const payload: Partial<PlanInput> = {};
        if (cleanName !== plan.name) payload.name = cleanName;
        if (cleanDescription !== (plan.description ?? "")) {
          payload.description = cleanDescription;
        }
        if (priceNumber !== plan.price) payload.price = priceNumber;
        if (daysNumber !== plan.durationDays) payload.durationDays = daysNumber;
        if (creditsNumber !== plan.credits) payload.credits = creditsNumber;
        if (servicesChanged) payload.serviceIds = selected;

        if (Object.keys(payload).length === 0) {
          setError("No changes to save.");
          setSubmitting(false);
          return;
        }

        await updatePlan(plan.id, payload);
        onSaved("Plan updated.");
      } else {
        await createPlan({
          name: cleanName,
          description: cleanDescription || undefined,
          price: priceNumber,
          durationDays: daysNumber,
          credits: creditsNumber,
          serviceIds: selected,
          isActive,
        });
        onSaved("Plan created.");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Could not save the plan."));
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Edit plan" : "Create plan"}
    >
      <div className="my-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-extrabold text-slate-900">
          {isEdit ? "Edit plan" : "Create plan"}
        </h2>
        {isEdit && (
          <p className="mt-1 text-xs text-slate-500">
            Changes apply to new subscribers. Existing subscriptions keep their own
            credits and dates.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <FormField
            id="plan-name"
            label="Plan name"
            placeholder="e.g. Premium Plan"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              id="plan-price"
              label="Price (BDT)"
              type="number"
              min={1}
              placeholder="3000"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
            <FormField
              id="plan-days"
              label="Duration (days)"
              type="number"
              min={1}
              placeholder="30"
              value={durationDays}
              onChange={(event) => setDurationDays(event.target.value)}
            />
            <FormField
              id="plan-credits"
              label="Service credits"
              type="number"
              min={1}
              placeholder="10"
              value={credits}
              onChange={(event) => setCredits(event.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="plan-description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Description (optional)
            </label>
            <textarea
              id="plan-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={fieldClass}
            />
          </div>

          {/* Service picker */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Included services</p>
              <p className="text-xs text-slate-500">{selected.length} selected</p>
            </div>
            <input
              type="search"
              value={serviceSearch}
              onChange={(event) => setServiceSearch(event.target.value)}
              placeholder="Filter services..."
              aria-label="Filter services"
              className={`${fieldClass} mb-2 py-2`}
            />
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {visibleOptions.length === 0 && (
                <p className="px-2 py-3 text-center text-sm text-slate-500">
                  No active services found. Create a service first.
                </p>
              )}
              {visibleOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(option.id)}
                      onChange={() => toggleService(option.id)}
                    />
                    <span className="font-medium text-slate-800">
                      {option.name}
                      {!option.isActive && (
                        <span className="ml-2 text-xs font-semibold text-red-600">
                          (inactive)
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatPrice(option.price)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {!isEdit && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Active (customers can subscribe)
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
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Create plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}