"use client"

import React from "react"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DropdownSelectProps<T> {
  items: T[]
  value?: T
  onSelect: (item: T) => void
  placeholder: string
  getLabel: (item: T) => string
  getImage?: (item: T) => string
  className?: string
}

export function DropdownSelect<T>({
  items,
  value,
  onSelect,
  placeholder,
  getLabel,
  getImage,
  className,
}: DropdownSelectProps<T>) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-14 px-4 text-left font-normal", className)}
        >
          {value ? (
            <div className="flex items-center gap-3">
              {getImage && (
                <img
                  src={getImage(value) || "/placeholder.svg"}
                  alt={getLabel(value)}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="font-medium">{getLabel(value)}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              {items.map((item, index) => (
                <CommandItem
                  key={index}
                  value={getLabel(item)}
                  onSelect={() => {
                    onSelect(item)
                    setOpen(false)
                  }}
                  className="flex items-center gap-3 p-3"
                >
                  {getImage && (
                    <img
                      src={getImage(item) || "/placeholder.svg"}
                      alt={getLabel(item)}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="font-medium">{getLabel(item)}</span>
                  <Check className={cn("ml-auto h-4 w-4", value === item ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
