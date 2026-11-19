import { z } from 'zod';

const paymentSchema = z.object({
  email: z.string().includes('@', { message: 'Enter a valid email.' }).transform(val => val.trim().toLowerCase()),
  sku: z.enum(['lamp', 'stool'], { message: 'Choose an item.' }),
  externalChargeId: z.string().regex(/^ch_[A-Za-z0-9]{8,}$/, { message: 'Enter a charge id like ch_12345678.' }),
  extraCode: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.extraCode === 'cushion' && data.sku !== 'stool') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'That extra is not sold with this item.',
      path: ['extraCode'],
    });
  }
});

// The shared function requested by the instructions
export function validatePayment(data: unknown) {
  const result = paymentSchema.safeParse(data);
  
  if (!result.success) {
    // Transform Zod errors into the exact { field: "message" } format they requested
    const errors: Record<string, string> = {};
    result.error.issues.forEach(issue => {
      if (issue.path[0]) {
        errors[issue.path[0] as string] = issue.message;
      }
    });
    return { ok: false as const, errors };
  }
  
  return { ok: true as const, data: result.data };
}