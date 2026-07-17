import * as React from "react"
import { Dialog as DialogPrimitive, Popover as PopoverPrimitive } from "radix-ui"
import { usePicker } from "./Picker"
import { cn } from "@/lib/utils"

export interface PickerTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

export const PickerTrigger = React.forwardRef<HTMLButtonElement, PickerTriggerProps>(
  ({ className, asChild, ...props }, ref) => {
    const { isMobile } = usePicker()

    if (isMobile) {
      return (
        <DialogPrimitive.Trigger asChild={asChild} className={className} {...props} ref={ref} />
      )
    }

    return (
      <PopoverPrimitive.Trigger asChild={asChild} className={className} {...props} ref={ref} />
    )
  }
)
PickerTrigger.displayName = "PickerTrigger"
