'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { cn } from "@workspace/ui/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within Tabs');
  }
  return context;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({ 
  defaultValue, 
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  children, 
  className 
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;
  
  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    controlledOnValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-8",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  ...props
}: TabsTriggerProps & Omit<React.ComponentProps<'button'>, 'onClick'>) {
  const { value: currentValue, onValueChange } = useTabsContext();
  const isActive = currentValue === value;
  
  return (
    <button
      {...props}
      onClick={() => onValueChange(value)}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap px-1 py-2 text-sm font-mono font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-0",
        "disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "text-white"
          : "text-neutral-500 hover:text-neutral-300",
        className
      )}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-px bg-neutral-500" />
      )}
    </button>
  );
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: currentValue } = useTabsContext();
  
  if (currentValue !== value) {
    return null;
  }
  
  return (
    <div className={cn("mt-6", className)}>
      {children}
    </div>
  );
}
