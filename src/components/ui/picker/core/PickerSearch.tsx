import * as React from "react"
import { SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PickerSearchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const PickerSearch = React.forwardRef<HTMLInputElement, PickerSearchProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="flex items-center border-b px-3 pb-2 pt-1 sticky top-0 bg-background z-10">
        <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          ref={ref}
          className={cn(
            "flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
PickerSearch.displayName = "PickerSearch"
