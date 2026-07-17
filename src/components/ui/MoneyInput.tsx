'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue'> {
  name?: string;
  defaultValue?: number;
  value?: number;
  onChange?: (value: number | null) => void;
  baseTextSize?: string;
  plain?: boolean;
}

export function MoneyInput({ 
  name, 
  defaultValue, 
  value, 
  onChange, 
  className,
  baseTextSize = 'text-4xl',
  required,
  plain,
  ...props 
}: MoneyInputProps) {
  
  const formatInitial = (val?: number | null) => {
    if (val === undefined || val === null || isNaN(val)) return '';
    const [intPart, decPart] = val.toString().split('.');
    
    // Formateo con Regex para evitar límite de precisión de parseInt
    let formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    if (decPart !== undefined) {
      formatted += ',' + decPart.slice(0, 2);
    }
    return formatted;
  };

  const [displayValue, setDisplayValue] = useState(() => formatInitial(value !== undefined ? value : defaultValue));
  
  const rawValue = displayValue
    ? parseFloat(displayValue.replace(/\./g, '').replace(',', '.'))
    : null;

  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      const formatted = formatInitial(value);
      if (formatted !== displayValue && parseFloat(formatted.replace(/\./g, '').replace(',', '.')) !== rawValue) {
        setDisplayValue(formatted);
      }
    }
  }, [value]);

  useEffect(() => {
    const form = inputRef.current?.closest('form');
    if (!form) return;

    const handleReset = () => {
      setDisplayValue(formatInitial(defaultValue));
    };

    form.addEventListener('reset', handleReset);
    return () => form.removeEventListener('reset', handleReset);
  }, [defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Limpiar caracteres no válidos (solo dígitos y coma)
    val = val.replace(/[^\d,]/g, '');
    
    // Evitar múltiples comas
    const commaParts = val.split(',');
    if (commaParts.length > 2) {
      val = commaParts[0] + ',' + commaParts.slice(1).join('');
    }

    // Limitar a 2 decimales
    if (commaParts.length === 2 && commaParts[1].length > 2) {
      val = commaParts[0] + ',' + commaParts[1].slice(0, 2);
    }

    // Formatear parte entera
    const currentCommaParts = val.split(',');
    let intPart = currentCommaParts[0];
    if (intPart) {
      // Eliminar ceros a la izquierda, excepto si es un solo cero
      intPart = intPart.replace(/^0+/, '');
      if (intPart === '') intPart = '0';
      // Formateo con Regex (sin parseInt para evitar que reemplace por 0 en numeros muy largos)
      intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    
    const finalDisplay = currentCommaParts.length > 1 
      ? `${intPart},${currentCommaParts[1]}` 
      : intPart;

    setDisplayValue(finalDisplay);

    if (onChange) {
      const numericVal = finalDisplay
        ? parseFloat(finalDisplay.replace(/\./g, '').replace(',', '.'))
        : null;
      onChange(numericVal !== null && !isNaN(numericVal) ? numericVal : null);
    }
  };

  // Cálculo de tamaño de fuente dinámico
  let dynamicSizeClass = baseTextSize;
  const len = displayValue.length;
  
  if (baseTextSize.includes('text-4xl')) {
    if (len > 11) dynamicSizeClass = 'text-2xl';
    else if (len > 8) dynamicSizeClass = 'text-3xl';
  } else if (baseTextSize.includes('text-5xl')) {
    if (len > 11) dynamicSizeClass = 'text-3xl';
    else if (len > 8) dynamicSizeClass = 'text-4xl';
  } else if (baseTextSize.includes('text-3xl')) {
    if (len > 11) dynamicSizeClass = 'text-xl';
    else if (len > 8) dynamicSizeClass = 'text-2xl';
  }

  const isPlain = plain !== undefined ? plain : (baseTextSize.includes('text-base') || baseTextSize.includes('text-sm'));

  // Establecer el ancho del input de forma dinámica para que no se corte
  // Usaremos un ancho del 100% y que dependa del contenedor (flexbox)
  return (
    <div className="relative inline-flex items-center w-full justify-center">
      {/* Real Input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        className={cn(
          "bg-transparent border-none outline-none caret-foreground transition-all duration-200 w-full min-w-0 font-numbers tracking-tight",
          !isPlain && "text-center text-transparent placeholder:text-transparent",
          dynamicSizeClass,
          className
        )}
        style={{ fontFamily: 'var(--font-outfit)' }}
        {...props}
      />

      {/* Overlay to display formatted text */}
      {!isPlain && (
        <div 
          className={cn(
            "pointer-events-none absolute inset-0 flex flex-col justify-center transition-all duration-200 w-full min-w-0 font-numbers tracking-tight text-center",
            dynamicSizeClass,
            className,
            "bg-transparent border-transparent shadow-none ring-0 outline-none text-foreground"
          )}
          style={{ fontFamily: 'var(--font-outfit)' }}
          aria-hidden="true"
        >
          {displayValue ? (
            <div className="w-full">
              {(() => {
                const parts = displayValue.split(',');
                const intPart = parts[0];
                const decPart = parts.length > 1 ? parts[1] : null;
                const isTypingComma = displayValue.endsWith(',');
                
                return (
                  <span className="inline-flex items-baseline">
                    <span>{intPart}</span>
                    {isTypingComma ? (
                      <span>,</span>
                    ) : decPart ? (
                      <span className="text-[0.65em] font-medium opacity-60 ml-[0.1em] relative -top-[0.4em]">
                        {decPart}
                      </span>
                    ) : null}
                  </span>
                );
              })()}
            </div>
          ) : (
            <div className="w-full text-muted-foreground/30 font-sans">
              {props.placeholder}
            </div>
          )}
        </div>
      )}
      {name && (
        <input 
          type="hidden" 
          name={name} 
          value={rawValue !== null && !isNaN(rawValue) ? rawValue : ''} 
          required={required}
        />
      )}
    </div>
  );
}
