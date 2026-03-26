import type { ViewMode, Quarter } from '../types'
import { QUARTER_LABELS, MONTHS_TR } from '../types'

interface Props {
  viewMode: ViewMode
  selectedQuarter: Quarter
  selectedMonth: number
  onViewModeChange: (mode: ViewMode) => void
  onQuarterChange: (q: Quarter) => void
  onMonthChange: (m: number) => void
}

export function CalendarToolbar({
  viewMode,
  selectedQuarter,
  selectedMonth,
  onViewModeChange,
  onQuarterChange,
  onMonthChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex bg-surface-alt rounded-lg p-0.5 border border-border">
          {(['year', 'quarter', 'month'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === mode
                  ? 'bg-white text-text shadow-sm'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              {mode === 'year' ? 'Tum Yil' : mode === 'quarter' ? 'Quarter' : 'Ay'}
            </button>
          ))}
        </div>
      </div>

      {/* Quarter Tabs */}
      {viewMode === 'quarter' && (
        <div className="flex gap-2 flex-wrap">
          {([1, 2, 3, 4] as Quarter[]).map(q => (
            <button
              key={q}
              onClick={() => onQuarterChange(q)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
                selectedQuarter === q
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                  : 'bg-white text-text-secondary border-border hover:border-primary/30 hover:text-primary'
              }`}
            >
              {QUARTER_LABELS[q]}
            </button>
          ))}
        </div>
      )}

      {/* Month Selector */}
      {viewMode === 'month' && (
        <div className="flex gap-1.5 flex-wrap">
          {MONTHS_TR.map((name, i) => (
            <button
              key={i}
              onClick={() => onMonthChange(i + 1)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                selectedMonth === i + 1
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-secondary border-border hover:border-primary/30'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
