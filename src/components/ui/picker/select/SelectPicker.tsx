import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Picker, PickerTrigger, PickerContent, PickerSearch, PickerOption, PickerEmpty, PickerSection } from "../core"
import { cn } from "@/lib/utils"

export interface SelectItem {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  group?: string
}

export interface SelectPickerProps {
  name?: string
  value?: string
  onChange?: (value: string) => void
  items: SelectItem[]
  placeholder?: string
  searchable?: boolean
  disabled?: boolean
  className?: string
}

export function SelectPicker({
  name,
  value,
  onChange,
  items,
  placeholder = "Seleccionar opción",
  searchable,
  disabled = false,
  className,
}: SelectPickerProps) {
  const [search, setSearch] = React.useState("")
  const [open, setOpen] = React.useState(false)

  const handleOpenChange = React.useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) setSearch("")
  }, [])

  const filteredItems = React.useMemo(() => {
    if (!search) return items
    const lowerSearch = search.toLowerCase()
    return items.filter(item =>
      item.label.toLowerCase().includes(lowerSearch) ||
      item.description?.toLowerCase().includes(lowerSearch)
    )
  }, [items, search])

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, SelectItem[]> = { default: [] }
    filteredItems.forEach(item => {
      const g = item.group || "default"
      if (!groups[g]) groups[g] = []
      groups[g].push(item)
    })
    return groups
  }, [filteredItems])

  const selectedItem = React.useMemo(() => items.find(i => i.value === value), [items, value])

  const handleSelect = React.useCallback((val: string) => {
    onChange?.(val)
    setOpen(false)
  }, [onChange])

  const isSearchable = searchable !== undefined ? searchable : items.length > 12;

  return (
    <Picker open={open} onOpenChange={handleOpenChange}>
      <PickerTrigger
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <span className="truncate">
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-primary shrink-0" />
      </PickerTrigger>
      {name && <input type="hidden" name={name} value={value || ""} />}

      <PickerContent className="w-[--radix-popover-trigger-width] min-w-[240px] p-0 flex flex-col">
        {isSearchable && (
          <div className="p-2 border-b border-border/50">
            <PickerSearch
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        <div className="py-1 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          {filteredItems.length === 0 ? (
            <PickerEmpty />
          ) : (
            <>
              {groupedItems.default?.map(item => (
                <PickerOption
                  key={item.value}
                  selected={item.value === value}
                  onClick={() => handleSelect(item.value)}
                >
                  <div className="flex flex-col items-start">
                    <span className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground mt-0.5">{item.description}</span>
                    )}
                  </div>
                </PickerOption>
              ))}

              {Object.entries(groupedItems).filter(([g]) => g !== "default").map(([group, groupItems]) => (
                <PickerSection key={group} title={group}>
                  {groupItems.map(item => (
                    <PickerOption
                      key={item.value}
                      selected={item.value === value}
                      onClick={() => handleSelect(item.value)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="flex items-center gap-2">
                          {item.icon}
                          {item.label}
                        </span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground mt-0.5">{item.description}</span>
                        )}
                      </div>
                    </PickerOption>
                  ))}
                </PickerSection>
              ))}
            </>
          )}
        </div>
      </PickerContent>
    </Picker>
  )
}
