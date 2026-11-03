"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Banknote, CheckCircle2, CreditCard, Loader2, ShoppingBag, Store, Truck } from "lucide-react";
import clsx from "clsx";

import { ApiError, apiFetch } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Order, OrderType, PaymentMethod } from "@/lib/types";
import { useHydrated } from "@/lib/useHydrated";
import { selectSubtotal, useCartStore } from "@/store/cartStore";

const DELIVERY_FEE = Number.parseFloat(process.env.NEXT_PUBLIC_DELIVERY_FEE ?? "2.50") || 0;

interface FormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = { name: "", phone: "", email: "", address: "", notes: "" };

function validate(form: FormState, orderType: OrderType): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = "Please enter your name";
  const digits = form.phone.replace(/\D/g, "");
  if (digits.length < 7 || form.phone.trim().length < 5) errors.phone = "Please enter a valid phone number";
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Please enter a valid email address";
  }
  if (orderType === "delivery" && !form.address.trim()) errors.address = "Delivery address is required";
  return errors;
}

export default function CheckoutPage() {
  const hydrated = useHydrated();
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore(selectSubtotal);
  const clear = useCartStore((s) => s.clear);

  const [orderType, setOrderType] = useState<OrderType>("collection");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const deliveryFee = orderType === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const update = (field: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || lines.length === 0) return;

    const fieldErrors = validate(form, orderType);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await apiFetch<Order>("/orders", {
        method: "POST",
        body: JSON.stringify({
          customer_name: form.name.trim(),
          customer_phone: form.phone.trim(),
          customer_email: form.email.trim() || null,
          order_type: orderType,
          delivery_address: orderType === "delivery" ? form.address.trim() : null,
          notes: form.notes.trim() || null,
          payment_method: payment,
          items: lines.map((line) => ({ menu_item_id: line.menuItemId, quantity: line.quantity })),
        }),
      });
      clear();
      setPlacedOrder(order);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "We couldn't reach the kitchen. Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-habibi-400" aria-label="Loading" />
      </div>
    );
  }

  if (placedOrder) {
    return (
      <div className="container-page max-w-2xl py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-8 text-center sm:p-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-olive-500/20"
          >
            <CheckCircle2 className="h-12 w-12 text-olive-400" aria-hidden />
          </motion.div>
          <h1 className="text-4xl font-bold">Order placed!</h1>
          <p className="mt-3 text-cream-100/70">
            Thanks, {placedOrder.customer_name}. We&apos;re on it.
            {placedOrder.order_type === "delivery"
              ? " Your food is on its way soon."
              : " We'll have it ready for collection shortly."}
          </p>
          <p className="mt-6 text-sm uppercase tracking-widest text-cream-100/50">Order number</p>
          <p className="text-gradient font-display text-4xl font-bold">{placedOrder.order_number}</p>

          <ul className="mt-8 space-y-2 border-t border-white/10 pt-6 text-left">
            {placedOrder.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>
                  {item.quantity} &times; {item.item_name}
                </span>
                <span className="text-cream-100/70">{formatPrice(item.line_total)}</span>
              </li>
            ))}
            {Number.parseFloat(placedOrder.delivery_fee) > 0 && (
              <li className="flex justify-between text-cream-100/70">
                <span>Delivery</span>
                <span>{formatPrice(placedOrder.delivery_fee)}</span>
              </li>
            )}
            <li className="flex justify-between border-t border-white/10 pt-3 text-xl font-bold">
              <span>Total</span>
              <span className="text-habibi-300">{formatPrice(placedOrder.total)}</span>
            </li>
          </ul>

          <Link href="/" className="btn-primary mt-8">
            Back to home
          </Link>
        </motion.div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <ShoppingBag className="h-14 w-14 text-habibi-400/60" aria-hidden />
        <h1 className="text-3xl font-bold">Your cart is empty</h1>
        <p className="text-cream-100/60">Add some items from the menu before checking out.</p>
        <Link href="/#menu" className="btn-primary">
          Browse the menu
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <h1 className="mb-10 text-4xl font-bold sm:text-5xl">
        Check<span className="text-gradient">out</span>
      </h1>

      <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-8">
          <fieldset className="glass rounded-3xl p-6">
            <legend className="px-2 font-display text-xl font-bold">How would you like it?</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(
                [
                  { value: "collection", label: "Collection", icon: Store },
                  { value: "delivery", label: "Delivery", icon: Truck },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={orderType === value}
                  onClick={() => setOrderType(value)}
                  className={clsx(
                    "flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 font-semibold transition",
                    orderType === value
                      ? "border-habibi-400 bg-habibi-500/15 text-habibi-300"
                      : "border-white/10 text-cream-100/70 hover:border-white/30",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden /> {label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="glass space-y-4 rounded-3xl p-6">
            <legend className="px-2 font-display text-xl font-bold">Your details</legend>

            <Field label="Full name" error={errors.name}>
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => update("name")(e.target.value)}
                autoComplete="name"
                maxLength={150}
                placeholder="Ahmed Khan"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone" error={errors.phone}>
                <input
                  className="input-field"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone")(e.target.value)}
                  autoComplete="tel"
                  maxLength={30}
                  placeholder="07123 456789"
                />
              </Field>
              <Field label="Email (optional)" error={errors.email}>
                <input
                  className="input-field"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email")(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </Field>
            </div>

            <AnimatePresence initial={false}>
              {orderType === "delivery" && (
                <motion.div
                  key="address"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Field label="Delivery address" error={errors.address}>
                    <textarea
                      className="input-field min-h-24 resize-y"
                      value={form.address}
                      onChange={(e) => update("address")(e.target.value)}
                      autoComplete="street-address"
                      maxLength={500}
                      placeholder="House number, street, postcode"
                    />
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>

            <Field label="Order notes (optional)">
              <textarea
                className="input-field min-h-20 resize-y"
                value={form.notes}
                onChange={(e) => update("notes")(e.target.value)}
                maxLength={1000}
                placeholder="Allergies, extra sauce, no onions..."
              />
            </Field>
          </fieldset>

          <fieldset className="glass rounded-3xl p-6">
            <legend className="px-2 font-display text-xl font-bold">Payment</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(
                [
                  { value: "cash", label: orderType === "delivery" ? "Cash on delivery" : "Pay at counter", icon: Banknote },
                  { value: "card", label: "Card", icon: CreditCard },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={payment === value}
                  onClick={() => setPayment(value)}
                  className={clsx(
                    "flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 font-semibold transition",
                    payment === value
                      ? "border-habibi-400 bg-habibi-500/15 text-habibi-300"
                      : "border-white/10 text-cream-100/70 hover:border-white/30",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden /> {label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="glass rounded-3xl p-6">
            <h2 className="font-display text-xl font-bold">Order summary</h2>
            <ul className="mt-4 space-y-3">
              {lines.map((line) => (
                <li key={line.menuItemId} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="font-semibold text-habibi-300">{line.quantity}&times;</span> {line.name}
                  </span>
                  <span className="shrink-0 text-cream-100/70">
                    {formatPrice(Number.parseFloat(line.price) * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-cream-100/70">Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cream-100/70">Delivery</dt>
                <dd>{orderType === "delivery" ? formatPrice(deliveryFee) : "Free"}</dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 text-xl font-bold">
                <dt>Total</dt>
                <dd className="text-habibi-300">{formatPrice(total)}</dd>
              </div>
            </dl>

            <AnimatePresence>
              {submitError && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 flex items-start gap-2 rounded-xl border border-chili-500/40 bg-chili-500/10 p-3 text-sm text-chili-400"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{submitError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={submitting} className="btn-primary mt-5 w-full text-lg">
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Placing order...
                </>
              ) : (
                <>Place order &middot; {formatPrice(total)}</>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-cream-100/50">
              Final prices are confirmed by the kitchen when your order is placed.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cream-100/80">{label}</span>
      {children}
      {error && (
        <span role="alert" className="mt-1.5 block text-sm text-chili-400">
          {error}
        </span>
      )}
    </label>
  );
}

