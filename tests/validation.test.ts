import { describe, it, expect, vi } from 'vitest';
import { store } from '@/app/lib/store';
import { POST as previewPost } from '@/app/api/payments/preview/route';
import { POST as recordPost } from '@/app/api/payments/route';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

describe('Shared payment validation', () => {
  it('preview and record both reject Cushion on Maple lamp', async () => {
    const badPayload = {
      email: 'ada@example.com',
      sku: 'lamp',
      extraCode: 'cushion',
      externalChargeId: 'ch_12345678',
    };

    const previewRes = await previewPost(
      new Request('http://localhost:3000/api/payments/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(badPayload),
      })
    );
    const previewJson = await previewRes.json();

    expect(previewRes.status).toBe(400);
    expect(previewJson.ok).toBe(false);
    expect(previewJson.errors.extraCode).toBe('That extra is not sold with this item.');

    const recordRes = await recordPost(
      new Request('http://localhost:3000/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(badPayload),
      })
    );
    const recordJson = await recordRes.json();

    expect(recordRes.status).toBe(400);
    expect(recordJson.ok).toBe(false);
    expect(recordJson.errors.extraCode).toBe('That extra is not sold with this item.');
  });

  it('preview leaves remaining stock unchanged', async () => {
    const lamp = store.products.find((p) => p.sku === 'lamp')!;
    const initialRemaining = lamp.remaining;

    const previewRes = await previewPost(
      new Request('http://localhost:3000/api/payments/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'Ada@Example.com',
          sku: 'lamp',
          extraCode: null,
          externalChargeId: 'ch_12345678',
        }),
      })
    );
    const previewJson = await previewRes.json();

    expect(previewRes.status).toBe(200);
    expect(previewJson.ok).toBe(true);
    expect(previewJson.preview.remainingAfter).toBe(initialRemaining! - 1);
    expect(lamp.remaining).toBe(initialRemaining);
  });
});