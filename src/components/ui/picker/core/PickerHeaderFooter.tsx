import * as React from "react"
import { cn } from "@/lib/utils"

export function PickerHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 px-4 pb-4 text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
}

export function PickerFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-4 pt-4 mt-auto border-t",
        className
      )}
      {...props}
    />
  )
}
