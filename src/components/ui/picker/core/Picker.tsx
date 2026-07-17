import * as React from "react"
import { Dialog as DialogPrimitive, Popover as PopoverPrimitive } from "radix-ui"
import { useMediaQuery } from "@/hooks/use-media-query"

type PickerContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  isMobile: boolean
}

const PickerContext = React.createContext<PickerContextValue | undefined>(undefined)

export function usePicker() {
  const context = React.useContext(PickerContext)
  if (!context) {
    throw new Error("usePicker must be used within a Picker")
  }
  return context
}

export interface PickerProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

export function Picker({ children, open: openProp, onOpenChange, defaultOpen = false }: PickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const open = openProp !== undefined ? openProp : uncontrolledOpen
  const setOpen = React.useCallback(
    (value: boolean) => {
      setUncontrolledOpen(value)
      onOpenChange?.(value)
    },
    [onOpenChange]
  )

  return (
    <PickerContext.Provider value={{ open, setOpen, isMobile }}>
      {isMobile ? (
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
          {children}
        </DialogPrimitive.Root>
      ) : (
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
          {children}
        </PopoverPrimitive.Root>
      )}
    </PickerContext.Provider>
  )
}
