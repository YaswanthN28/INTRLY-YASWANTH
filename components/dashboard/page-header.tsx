import React from "react"
import { cn } from "@/lib/utils"

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode
  description?: React.ReactNode
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn("flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8", className)}
      {...props}
    >
      <div className="space-y-1.5 flex-1 min-w-0">
        {eyebrow && (
          <p className="text-sm font-semibold text-primary uppercase tracking-widest">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground truncate">
          {title}
        </h1>
        {description && (
          <p className="text-lg text-muted-foreground max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
