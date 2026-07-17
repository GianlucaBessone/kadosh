import * as React from "react"
import { format, setMonth, setYear, startOfMonth, endOfMonth, addDays, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { Picker, PickerTrigger, PickerContent } from "../core"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export interface DatePickerProps {
  name?: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: Date
  maxDate?: Date
}

type ViewMode = "calendar" | "month" | "year"

export function DatePicker({
  name,
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>("calendar")
  const [currentMonth, setCurrentMonth] = React.useState<Date>(value || new Date())
  const [yearPage, setYearPage] = React.useState(Math.floor((value || new Date()).getFullYear() / 12) * 12)

  // Reset view mode when opening
  React.useEffect(() => {
    if (open) {
      setViewMode("calendar")
      setCurrentMonth(value || new Date())
      setYearPage(Math.floor((value || new Date()).getFullYear() / 12) * 12)
    }
  }, [open, value])

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date)
    setOpen(false)
  }



  const toggleViewMode = () => {
    if (viewMode === "calendar") setViewMode("month")
    else if (viewMode === "month") setViewMode("year")
    else setViewMode("calendar")
  }

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(setMonth(currentMonth, monthIndex))
    setViewMode("calendar")
  }

  const handleYearSelect = (year: number) => {
    setCurrentMonth(setYear(currentMonth, year))
    setViewMode("month")
  }

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextYearPage = () => setYearPage(yearPage + 12)
  const prevYearPage = () => setYearPage(yearPage - 12)

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(i)
    return format(d, "MMM", { locale: es })
  })

  const years = Array.from({ length: 12 }, (_, i) => yearPage + i)

  return (
    <Picker open={open} onOpenChange={setOpen}>
      <PickerTrigger
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value ? format(value, "dd/MM/yyyy") : placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
      </PickerTrigger>
      {name && <input type="hidden" name={name} value={value ? value.toISOString().split('T')[0] : ""} />}

      <PickerContent className="w-auto p-0 flex flex-col justify-center min-w-[280px] overflow-hidden rounded-2xl">
        <div className="p-4 bg-card flex flex-col gap-3">

          {/* Custom Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={viewMode === "year" ? prevYearPage : prevMonth}
              className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={toggleViewMode}
              className="px-3 py-1 rounded-full hover:bg-muted font-semibold text-[15px] tracking-tight transition-colors capitalize"
            >
              {viewMode === "year"
                ? `${years[0]} - ${years[11]}`
                : format(currentMonth, "MMMM yyyy", { locale: es })
              }
            </button>
            <button
              onClick={viewMode === "year" ? nextYearPage : nextMonth}
              className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="relative min-h-[240px]">
            <AnimatePresence mode="wait" initial={false}>
              {viewMode === "calendar" && (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex justify-center"
                >
                  <DayPicker
                    className="-mt-2"
                    mode="single"
                    selected={value}
                    onSelect={handleSelect}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    locale={es}
                    showOutsideDays
                    hideNavigation
                    style={{
                      "--rdp-accent-color": "var(--color-primary)",
                      "--rdp-accent-background-color": "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                      "--rdp-today-color": "var(--color-primary)",
                      "--rdp-outside-opacity": "0.3",
                      "--rdp-day-height": "36px",
                      "--rdp-day-width": "36px",
                      "--rdp-day_button-height": "34px",
                      "--rdp-day_button-width": "34px",
                      "--rdp-day_button-border-radius": "9999px",
                    } as React.CSSProperties}
                    disabled={[
                      ...(minDate ? [{ before: minDate }] : []),
                      ...(maxDate ? [{ after: maxDate }] : [])
                    ]}
                  />
                </motion.div>
              )}
              {viewMode === "month" && (
                <motion.div
                  key="month"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 grid grid-cols-3 gap-2 place-content-center"
                >
                  {months.map((m, i) => {
                    const isSelected = currentMonth.getMonth() === i
                    return (
                      <button
                        key={m}
                        onClick={() => handleMonthSelect(i)}
                        className={cn(
                          "h-12 rounded-2xl flex items-center justify-center text-sm font-medium capitalize transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                            : "hover:bg-muted text-foreground"
                        )}
                      >
                        {m}
                      </button>
                    )
                  })}
                </motion.div>
              )}
              {viewMode === "year" && (
                <motion.div
                  key="year"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 grid grid-cols-3 gap-2 place-content-center"
                >
                  {years.map(y => {
                    const isSelected = currentMonth.getFullYear() === y
                    return (
                      <button
                        key={y}
                        onClick={() => handleYearSelect(y)}
                        className={cn(
                          "h-12 rounded-2xl flex items-center justify-center text-sm font-medium transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                            : "hover:bg-muted text-foreground"
                        )}
                      >
                        {y}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>



      </PickerContent>
    </Picker>
  )
}

