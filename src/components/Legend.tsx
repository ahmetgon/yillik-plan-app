import type { Category } from '../types'

interface Props {
  categories: Category[]
}

export function Legend({ categories }: Props) {
  if (categories.length === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 py-4 px-4">
      {categories.map(cat => (
        <div key={cat.id} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: cat.color }}
          />
          <span className="text-[11px] text-text-secondary">{cat.name}</span>
        </div>
      ))}
    </div>
  )
}
