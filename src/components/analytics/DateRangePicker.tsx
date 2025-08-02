"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, ChevronDown } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const today = new Date();
  
  const presetRanges: DateRange[] = [
    {
      start: subDays(today, 7),
      end: today,
      label: 'Last 7 days'
    },
    {
      start: subDays(today, 30),
      end: today,
      label: 'Last 30 days'
    },
    {
      start: subDays(today, 90),
      end: today,
      label: 'Last 3 months'
    },
    {
      start: startOfWeek(today),
      end: endOfWeek(today),
      label: 'This week'
    },
    {
      start: startOfWeek(subDays(today, 7)),
      end: endOfWeek(subDays(today, 7)),
      label: 'Last week'
    },
    {
      start: startOfMonth(today),
      end: endOfMonth(today),
      label: 'This month'
    },
    {
      start: startOfMonth(subMonths(today, 1)),
      end: endOfMonth(subMonths(today, 1)),
      label: 'Last month'
    }
  ];

  const currentRange = value || presetRanges[1]; // Default to last 30 days

  const formatDateRange = (range: DateRange) => {
    const start = format(range.start, 'MMM dd');
    const end = format(range.end, 'MMM dd');
    const year = format(range.end, 'yyyy');
    
    if (range.start.getFullYear() !== range.end.getFullYear()) {
      return `${format(range.start, 'MMM dd, yyyy')} - ${format(range.end, 'MMM dd, yyyy')}`;
    } else if (range.start.getMonth() !== range.end.getMonth()) {
      return `${start} - ${end}, ${year}`;
    } else {
      return `${format(range.start, 'dd')} - ${format(range.end, 'dd MMM yyyy')}`;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          <Calendar className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">
            {currentRange.label}
          </span>
          <span className="sm:hidden">
            {format(currentRange.start, 'MMM dd')} - {format(currentRange.end, 'MMM dd')}
          </span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Select Date Range</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {presetRanges.map((range, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => onChange(range)}
            className="cursor-pointer flex flex-col items-start py-3"
          >
            <div className="font-medium">{range.label}</div>
            <div className="text-xs text-muted-foreground">
              {formatDateRange(range)}
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* Custom date range option - in a real app, this would open a date picker */}
        <DropdownMenuItem className="cursor-pointer opacity-50" disabled>
          <div>
            <div className="font-medium">Custom Range</div>
            <div className="text-xs text-muted-foreground">
              Coming soon
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper hook to manage date range state
export function useDateRange(initialRange?: DateRange) {
  const defaultRange: DateRange = {
    start: subDays(new Date(), 30),
    end: new Date(),
    label: 'Last 30 days'
  };

  const [dateRange, setDateRange] = useState<DateRange>(initialRange || defaultRange);

  return {
    dateRange,
    setDateRange,
    isToday: (date: Date) => {
      const today = new Date();
      return date.toDateString() === today.toDateString();
    },
    isWithinRange: (date: Date) => {
      return date >= dateRange.start && date <= dateRange.end;
    },
    getDayCount: () => {
      return Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    }
  };
}