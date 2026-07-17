import * as React from "react"
import { Dialog as DialogPrimitive, Popover as PopoverPrimitive } from "radix-ui"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { usePicker } from "./Picker"

import { HTMLMotionProps } from "framer-motion"

export interface PickerContentProps extends Omit<HTMLMotionProps<"div">, "align" | "sideOffset"> {
  children: React.ReactNode
  className?: string
  align?: "center" | "start" | "end"
  sideOffset?: number
}

export function PickerContent({
  children,
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: PickerContentProps) {
  const { open, setOpen, isMobile } = usePicker()

  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild>
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                className={cn(
                  "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[96%] flex-col rounded-t-[20px] border bg-background shadow-lg outline-none",
                  className
                )}
                {...props}
              >
                <div className="mx-auto mt-4 h-1.5 w-[40px] shrink-0 rounded-full bg-muted" />
                {children}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <PopoverPrimitive.Portal forceMount>
          <PopoverPrimitive.Content
            align={align}
            sideOffset={sideOffset}
            asChild
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "z-50 min-w-[12rem] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-lg outline-none",
                className
              )}
              {...props}
            >
              {children}
            </motion.div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      )}
    </AnimatePresence>
  )
}
