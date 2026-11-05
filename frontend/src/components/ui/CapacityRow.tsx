import type { Space } from '@/content/site'

/**
 * The Seated / Cocktail / Theatre row every real venue site leads with.
 * The uppercase labels here are data labels — the one place v3 keeps them.
 */
export function CapacityRow({ capacity }: { capacity: Space['capacity'] }) {
  const entries = [
    ['Seated', capacity.seated],
    ['Cocktail', capacity.cocktail],
    ['Theatre', capacity.theatre],
  ] as const

  return (
    <dl className="flex gap-10">
      {entries.map(([label, value]) => (
        <div key={label}>
          <dt className="eyebrow">{label}</dt>
          <dd className="mt-1 font-display text-2xl text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
