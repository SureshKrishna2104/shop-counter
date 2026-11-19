import { Suspense } from 'react';
import Link from 'next/link';
import { getCatalog } from '@/app/lib/catalog';
import { formatUsd } from '@/app/lib/money';

async function ShopContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q, sort: sortParam } = await searchParams;

  let items = await getCatalog();
  const query = q?.toLowerCase() || '';
  if (query) {
    items = items.filter((item) => item.name.toLowerCase().includes(query));
  }

  const sort = sortParam || 'name';
  items = [...items].sort((a, b) => {
    if (sort === 'price-asc') return a.priceCents - b.priceCents;
    if (sort === 'price-desc') return b.priceCents - a.priceCents;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      <form method="GET" className="mb-8 flex gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium mb-1">
            Search
          </label>
          <input
            id="search"
            name="q"
            defaultValue={query}
            className="border p-2 rounded"
          />
        </div>
        <div>
          <label htmlFor="sort" className="block text-sm font-medium mb-1">
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="border p-2 rounded"
          >
            <option value="name">name</option>
            <option value="price-asc">price-asc</option>
            <option value="price-desc">price-desc</option>
          </select>
        </div>
        <button
          type="submit"
          className="self-end bg-blue-600 text-white px-4 py-2 rounded"
        >
          Apply
        </button>
      </form>

      {items.length === 0 ? (
        <p>No items match.</p>
      ) : (
        <ul className="grid gap-4">
          {items.map((item) => (
            <li key={item.sku} className="border p-4 rounded hover:bg-gray-50">
              <Link href={`/shop/${item.sku}`} className="block">
                <div className="font-semibold">{item.name}</div>
                <div>{formatUsd(item.priceCents)}</div>
                <div className="text-sm text-gray-500">
                  {item.remaining !== null
                    ? `${item.remaining} left`
                    : 'Not stock-limited'}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Shop</h1>
      <Suspense fallback={<p>Loading catalogue...</p>}>
        <ShopContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}