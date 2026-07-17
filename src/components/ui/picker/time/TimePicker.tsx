import * as React from "react"
import { ClockIcon, CheckIcon } from "lucide-react"
import { Picker, PickerTrigger, PickerContent } from "../core"
import { cn } from "@/lib/utils"

export interface TimePickerProps {
  name?: string
  value?: string // HH:mm format
  onChange?: (time: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const ITEM_HEIGHT = 40; // Altura de cada opción en px
const VISIBLE_ITEMS = 5; // Opciones visibles al mismo tiempo (debe ser impar)
const HALF_VISIBLE = Math.floor(VISIBLE_ITEMS / 2);

function WheelColumn({ items, value, onChange, width = "w-16" }: { items: string[], value: string, onChange: (val: string) => void, width?: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(items.indexOf(value));
  const isScrolling = React.useRef(false);
  const scrollTimeout = React.useRef<NodeJS.Timeout>(undefined);

  React.useEffect(() => {
    const idx = items.indexOf(value);
    if (idx !== -1 && !isScrolling.current && containerRef.current) {
      setActiveIndex(idx);
      containerRef.current.scrollTop = idx * ITEM_HEIGHT;
    }
  }, [value, items]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    isScrolling.current = true;
    
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    
    const scrollTop = containerRef.current.scrollTop;
    let idx = Math.round(scrollTop / ITEM_HEIGHT);
    idx = Math.max(0, Math.min(idx, items.length - 1));
    setActiveIndex(idx);

    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false;
      if (items[idx] !== value) {
        onChange(items[idx]);
      }
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
      }
    }, 150);
  };

  const handleItemClick = (idx: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
    setActiveIndex(idx);
    onChange(items[idx]);
  };

  return (
    <div 
      className={cn("relative flex flex-col overflow-hidden", width)}
      style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
    >
      <div 
        className="absolute w-full bg-primary/10 rounded-lg pointer-events-none" 
        style={{ 
          height: ITEM_HEIGHT, 
          top: ITEM_HEIGHT * HALF_VISIBLE,
          left: 0,
          right: 0
        }} 
      />
      
      <div 
        ref={containerRef}
        className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] snap-y snap-mandatory cursor-pointer"
        onScroll={handleScroll}
      >
        <div style={{ height: ITEM_HEIGHT * HALF_VISIBLE }} className="shrink-0" />
        {items.map((item, idx) => {
          const distance = Math.abs(idx - activeIndex);
          const opacity = distance === 0 ? 1 : distance === 1 ? 0.4 : 0.1;
          const scale = distance === 0 ? 1 : distance === 1 ? 0.9 : 0.8;
          const rotateX = distance === 0 ? 0 : (idx > activeIndex ? 25 : -25);
          
          return (
            <div
              key={item}
              onClick={() => handleItemClick(idx)}
              className="flex items-center justify-center font-medium snap-center transition-all duration-200"
              style={{ 
                height: ITEM_HEIGHT,
                opacity,
                transform: `scale(${scale}) rotateX(${rotateX}deg)`,
                transformOrigin: 'center'
              }}
            >
              {item}
            </div>
          );
        })}
        <div style={{ height: ITEM_HEIGHT * HALF_VISIBLE }} className="shrink-0" />
      </div>
    </div>
  );
}

export function TimePicker({
  name,
  value,
  onChange,
  placeholder = "Seleccionar hora",
  disabled = false,
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  const currentHour = value ? value.split(":")[0] : "12"
  const currentMinute = value ? value.split(":")[1] : "00"

  const hours = React.useMemo(() => Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")), []);
  const minutes = React.useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
  }, []);

  const handleTimeChange = (type: "hour" | "minute", val: string) => {
    let newHour = currentHour
    let newMinute = currentMinute
    if (type === "hour") newHour = val
    if (type === "minute") newMinute = val
    onChange?.(`${newHour}:${newMinute}`)
  }

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
          {value ? `${value} hs` : placeholder}
        </span>
        <ClockIcon className="h-4 w-4 text-primary shrink-0" />
      </PickerTrigger>
      {name && <input type="hidden" name={name} value={value || ""} />}
      
      <PickerContent className="w-auto p-0 flex flex-col justify-center min-w-[240px]">
        <div className="flex justify-center items-center p-4 gap-3" style={{ perspective: '800px' }}>
          <WheelColumn 
            items={hours} 
            value={currentHour} 
            onChange={(val) => handleTimeChange("hour", val)} 
          />
          <div className="text-xl font-bold text-muted-foreground -mt-1">:</div>
          <WheelColumn 
            items={minutes} 
            value={currentMinute} 
            onChange={(val) => handleTimeChange("minute", val)} 
          />
        </div>
        <div className="p-3 border-t border-border/50 bg-muted/10">
          <button 
            onClick={() => setOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <CheckIcon className="w-4 h-4" />
            Confirmar
          </button>
        </div>
      </PickerContent>
    </Picker>
  )
}
