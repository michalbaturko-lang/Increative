'use client'

import * as React from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function Select({ value, onValueChange, options, placeholder = 'Vyber...', className, disabled }: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition-colors',
          'hover:border-white/20 hover:bg-white/10',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          open && 'border-primary/50 ring-2 ring-primary/20',
          disabled && 'opacity-50 cursor-not-allowed hover:border-white/10 hover:bg-white/5'
        )}
      >
        <span className={cn(
          'flex items-center gap-2',
          !selectedOption && 'text-muted-foreground'
        )}>
          {selectedOption?.icon}
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={cn(
          'h-4 w-4 text-muted-foreground transition-transform',
          open && 'rotate-180'
        )} />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-xl border border-white/10 bg-card p-1 shadow-xl fade-in">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onValueChange(option.value)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                'hover:bg-white/10',
                value === option.value && 'bg-primary/20 text-primary'
              )}
            >
              {option.icon}
              <span className="flex-1 text-left">{option.label}</span>
              {value === option.value && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
