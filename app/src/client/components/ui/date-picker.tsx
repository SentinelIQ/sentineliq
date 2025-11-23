import React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "../../../lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

interface DatePickerProps {
  date?: Date
  value?: Date
  onDateChange?: (date: Date | undefined) => void
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({
  date,
  value,
  onDateChange,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
}: DatePickerProps) {
  const selectedDate = date || value
  const handleChange = onDateChange || onChange

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleChange}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}

