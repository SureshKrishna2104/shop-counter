'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formatUsd } from '@/app/lib/money';
import type { Payment } from '@/app/lib/store';

type FormValues = {
  email: string;
  sku: string;
  extraCode: string;
  externalChargeId: string;
};

type PreviewData = {
  email: string;
  sku: string;
  itemName: string;
  extraCode: string | null;
  extraName: string | null;
  totalCents: number;
  remainingAfter: number | null;
};

export default function DeskPage() {
  const { register, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      email: '',
      sku: 'lamp',
      extraCode: '',
      externalChargeId: '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [recorded, setRecorded] = useState<{ payment: Payment; replayed: boolean } | null>(null);
  const [queue, setQueue] = useState<Payment[]>([]);

  const selectedSku = watch('sku');

  // Choosing Maple lamp clears a selected Cushion in the form
  useEffect(() => {
    if (selectedSku === 'lamp') {
      setValue('extraCode', '');
    }
  }, [selectedSku, setValue]);

  async function loadQueue() {
    const res = await fetch('/api/payments');
    if (res.ok) {
      const json = await res.json();
      setQueue(json.payments || []);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  async function onPreview(data: FormValues) {
    setErrors({});
    setRecorded(null);

    const res = await fetch('/api/payments/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        extraCode: data.extraCode || null,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setPreview(null);
      setErrors(json.errors || {});
      return;
    }

    setPreview(json.preview);
  }

  async function onRecord(data: FormValues) {
    setErrors({});
    setPreview(null);

    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        extraCode: data.extraCode || null,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setRecorded(null);
      setErrors(json.errors || {});
      return;
    }

    setRecorded({ payment: json.payment, replayed: json.replayed });
    await loadQueue();
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-6">Staff Desk: Record a Payment</h1>

        <form className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full border border-zinc-700 rounded px-3 py-2 bg-transparent"
            />
            {errors.email && <p role="alert" className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="sku" className="block text-sm font-medium mb-1">
              Item
            </label>
            <select
              id="sku"
              {...register('sku')}
              className="w-full border border-zinc-700 rounded px-3 py-2"
            >
              <option value="lamp">Maple lamp ($80)</option>
              <option value="stool">Cedar stool ($120)</option>
            </select>
            {errors.sku && <p role="alert" className="text-red-400 text-sm mt-1">{errors.sku}</p>}
          </div>

          <div>
            <label htmlFor="extraCode" className="block text-sm font-medium mb-1">
              Extra
            </label>
            <select
              id="extraCode"
              {...register('extraCode')}
              className="w-full border border-zinc-700 rounded px-3 py-2"
            >
              <option value="">None</option>
              <option value="cushion">Cushion (+$25)</option>
            </select>
            {errors.extraCode && (
              <p role="alert" className="text-red-400 text-sm mt-1">{errors.extraCode}</p>
            )}
          </div>

          <div>
            <label htmlFor="externalChargeId" className="block text-sm font-medium mb-1">
              Charge id
            </label>
            <input
              id="externalChargeId"
              type="text"
              placeholder="ch_12345678"
              {...register('externalChargeId')}
              className="w-full border border-zinc-700 rounded px-3 py-2 bg-transparent"
            />
            {errors.externalChargeId && (
              <p role="alert" className="text-red-400 text-sm mt-1">{errors.externalChargeId}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSubmit(onPreview)}
              className="border border-zinc-600 px-4 py-2 rounded hover:bg-zinc-800"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={handleSubmit(onRecord)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
            >
              Record payment
            </button>
          </div>
        </form>

        {preview && (
          <section
            aria-labelledby="payment-preview-heading"
            className="mt-6 p-4 border border-zinc-700 rounded bg-zinc-900 space-y-1 text-sm"
          >
            <h2 id="payment-preview-heading" className="font-semibold text-base mb-2">
              Payment preview
            </h2>
            <p>Email: {preview.email}</p>
            <p>Item: {preview.itemName}</p>
            <p>Extra: {preview.extraName ?? 'None'}</p>
            <p>Total: {formatUsd(preview.totalCents)}</p>
            <p>Remaining after: {preview.remainingAfter ?? 'Not stock-limited'}</p>
          </section>
        )}

        {recorded && (
          <section
            aria-live="polite"
            className="mt-6 p-4 border border-green-500 rounded bg-green-950/30 space-y-1 text-sm"
          >
            <h2 className="font-semibold text-green-400 text-base mb-1">
              {recorded.replayed ? 'Payment already recorded (replayed)' : 'Payment recorded'}
            </h2>
            <p>{recorded.payment.itemName} — {formatUsd(recorded.payment.totalCents)}</p>
            <p className="text-zinc-300">
              {recorded.payment.email} ({recorded.payment.externalChargeId})
            </p>
          </section>
        )}
      </div>

      <section aria-labelledby="payment-queue-heading" className="border-t border-zinc-800 pt-6">
        <h2 id="payment-queue-heading" className="text-xl font-semibold mb-4">
          Payment queue
        </h2>
        {queue.length === 0 ? (
          <p className="text-zinc-400">No payments recorded.</p>
        ) : (
          <ul className="space-y-2">
            {queue.map((p) => (
              <li
                key={p.externalChargeId}
                className="border border-zinc-800 rounded p-3 flex flex-wrap justify-between gap-2 text-sm"
              >
                <span>{p.email}</span>
                <span>{p.itemName}</span>
                <span className="font-semibold">{formatUsd(p.totalCents)}</span>
                <span className="font-mono text-zinc-400">{p.externalChargeId}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}