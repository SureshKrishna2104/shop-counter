import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getCatalog } from '@/app/lib/catalog';
import { formatUsd } from '@/app/lib/money';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  const catalog = await getCatalog();
  const item = catalog.find((p) => p.sku === sku);

  if (!item) return { title: 'Not Found | Shop counter' };

  return {
    title: `${item.name} | Shop counter`,
    description: `Buy ${item.name} for ${formatUsd(item.priceCents)}`,
  };
}

async function ProductContent({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  const catalog = await getCatalog();
  const item = catalog.find((p) => p.sku === sku);

  if (!item) {
    notFound();
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-2">{item.name}</h1>
      <p className="text-xl mb-4">{formatUsd(item.priceCents)}</p>

      <p className="mb-6">
        {item.remaining !== null
          ? `${item.remaining} remaining`
          : 'Not stock-limited'}
      </p>

      {item.extras.length > 0 && (
        <div>
          <h2 className="font-semibold">Extras:</h2>
          <ul className="list-disc ml-5">
            {item.extras.map((extra) => (
              <li key={extra.code}>
                {extra.name} (+{formatUsd(extra.priceCents)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  return (
    <div className="p-8 max-w-xl mx-auto">
      <Suspense fallback={<p>Loading item...</p>}>
        <ProductContent params={params} />
      </Suspense>
    </div>
  );
}