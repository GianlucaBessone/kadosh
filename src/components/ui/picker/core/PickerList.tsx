import * as React from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PickerOptionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  disabled?: boolean
}

export const PickerOption = React.forwardRef<HTMLButtonElement, PickerOptionProps>(
  ({ className, selected, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        role="option"
        aria-selected={selected}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-xl py-3 px-4 text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-50",
          selected && "bg-primary/5 text-primary",
          className
        )}
        {...props}
      >
        <span className="flex-1 text-left flex items-center">{children}</span>
        {selected && (
          <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center text-primary">
            <CheckIcon className="h-5 w-5 stroke-[3]" />
          </span>
        )}
      </button>
    )
  }
)
PickerOption.displayName = "PickerOption"

export function PickerSection({
  className,
  title,
  children,
}: {
  className?: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("py-1", className)}>
      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  )
}

export function PickerEmpty({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={cn("py-6 text-center text-sm text-muted-foreground", className)}>
      {children || "No se encontraron resultados."}
    </div>
  )
}
