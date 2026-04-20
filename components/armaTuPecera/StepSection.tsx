'use client'

import { CheckCircle2, Lock } from 'lucide-react'
import type { ReactNode } from 'react'

interface StepSectionProps {
  step: number
  title: string
  description?: string
  isCompleted: boolean
  isLocked: boolean
  children: ReactNode
}

export function StepSection({
  step,
  title,
  description,
  isCompleted,
  isLocked,
  children,
}: StepSectionProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-background p-5 transition-opacity ${
        isLocked ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
            isCompleted
              ? 'bg-teal text-white'
              : isLocked
              ? 'bg-muted text-foreground/40'
              : 'bg-teal text-white'
          }`}
        >
          {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : step}
        </div>
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-foreground">{title}</h2>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {isLocked ? (
        <p className="text-sm text-muted-foreground">
          Completa el paso anterior para continuar.
        </p>
      ) : (
        children
      )}
    </div>
  )
}
