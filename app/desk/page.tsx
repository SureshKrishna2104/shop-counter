'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { formatUsd } from '@/app/lib/money';

type FormValues = {
  email: string;
  sku: string;
  extraCode: string;
  externalChargeId: string;
};

type PaymentResult = {
  email: string;
  sku: string;
  itemName: string;
  extraCode: string | null;
  externalChargeId: string;
  totalCents: number;
};

export default function DeskPage() {
  const { register, handleSubmit, setError, clearErrors, formState: { errors } } = useForm<FormValues>({
    defaultValues: { email: '', sku: '', extraCode: '', externalChargeId: '' },
  });

  const [preview, setPreview] = useState<PaymentResult | null>(null);
  const [recorded, setRecorded] = useState<PaymentResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  async function submitTo(endpoint: '/api/payments/preview' | '/api/payments', data: FormValues) {
    clearErrors();
    setServerError(null);

    const payload = {
      ...data,
      extraCode: data.extraCode || null,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      if (json.errors) {
        Object.entries(json.errors).forEach(([field, message]) => {
          setError(field as keyof FormValues, { message: message as string });
        });
      } else if (json.error) {
        setServerError(json.error);
      }
      return;
    }

    if (endpoint === '/api/payments/preview') {
      setPreview(json.preview);
      setRecorded(null);
    } else {
      setRecorded(json.payment);
      setPreview(null);
    }
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Staff Desk: Record a Payment</h1>

      <form className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input id="email" {...register('email')} className="border p-2 rounded w-full" />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="sku" className="block text-sm font-medium mb-1">Item</label>
          <select id="sku" {...register('sku')} className="border p-2 rounded w-full">
            <option value="">Select an item</option>
            <option value="lamp">Maple lamp ($80)</option>
            <option value="stool">Cedar stool ($120)</option>
          </select>
          {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku.message}</p>}
        </div>

        <div>
          <label htmlFor="extraCode" className="block text-sm font-medium mb-1">Extra</label>
          <select id="extraCode" {...register('extraCode')} className="border p-2 rounded w-full">
            <option value="">None</option>
            <option value="cushion">Cushion (+$25)</option>
          </select>
          {errors.extraCode && <p className="text-red-600 text-sm mt-1">{errors.extraCode.message}</p>}
        </div>

        <div>
          <label htmlFor="externalChargeId" className="block text-sm font-medium mb-1">Charge ID</label>
          <input id="externalChargeId" {...register('externalChargeId')} placeholder="ch_12345678" className="border p-2 rounded w-full" />
          {errors.externalChargeId && <p className="text-red-600 text-sm mt-1">{errors.externalChargeId.message}</p>}
        </div>

        {serverError && <p className="text-red-600 font-medium">{serverError}</p>}

        <div className="flex gap-4 pt-2">
          <button
            type="button"
            onClick={handleSubmit((data) => submitTo('/api/payments/preview', data))}
            className="border border-gray-400 px-4 py-2 rounded"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={handleSubmit((data) => submitTo('/api/payments', data))}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Record payment
          </button>
        </div>
      </form>

      {preview && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Preview</h2>
          <p>{preview.itemName} — {formatUsd(preview.totalCents)}</p>
          <p className="text-sm text-gray-600">{preview.email} ({preview.externalChargeId})</p>
        </div>
      )}

      {recorded && (
        <div className="mt-6 p-4 border border-green-500 rounded bg-green-50">
          <h2 className="font-semibold text-green-800 mb-2">Payment Recorded</h2>
          <p>{recorded.itemName} — {formatUsd(recorded.totalCents)}</p>
          <p className="text-sm text-gray-600">{recorded.email} ({recorded.externalChargeId})</p>
        </div>
      )}
    </div>
  );
}