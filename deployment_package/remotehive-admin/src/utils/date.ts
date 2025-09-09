/**
 * Date utility functions for the admin panel
 */

// Date formatting
export const formatDate = (date: string | Date, format = 'MMM dd, yyyy'): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }
  
  const options: Intl.DateTimeFormatOptions = {};
  
  switch (format) {
    case 'short':
      options.dateStyle = 'short';
      break;
    case 'medium':
      options.dateStyle = 'medium';
      break;
    case 'long':
      options.dateStyle = 'long';
      break;
    case 'full':
      options.dateStyle = 'full';
      break;
    default:
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
  }
  
  return d.toLocaleDateString('en-US', options);
};

// Time formatting
export const formatTime = (date: string | Date, format: '12h' | '24h' = '12h'): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid Time';
  }
  
  return d.toLocaleTimeString('en-US', {
    hour12: format === '12h',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// DateTime formatting
export const formatDateTime = (
  date: string | Date,
  dateFormat = 'medium',
  timeFormat: '12h' | '24h' = '12h'
): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid DateTime';
  }
  
  return `${formatDate(d, dateFormat)} at ${formatTime(d, timeFormat)}`;
};

// Relative time formatting (e.g., "2 hours ago")
export const formatRelativeTime = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
};

// Get time ago in a more precise format
export const getTimeAgo = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);
  
  if (diffInYears > 0) {
    return rtf.format(-diffInYears, 'year');
  }
  if (diffInMonths > 0) {
    return rtf.format(-diffInMonths, 'month');
  }
  if (diffInWeeks > 0) {
    return rtf.format(-diffInWeeks, 'week');
  }
  if (diffInDays > 0) {
    return rtf.format(-diffInDays, 'day');
  }
  if (diffInHours > 0) {
    return rtf.format(-diffInHours, 'hour');
  }
  if (diffInMinutes > 0) {
    return rtf.format(-diffInMinutes, 'minute');
  }
  
  return rtf.format(-diffInSeconds, 'second');
};

// Date calculations
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addWeeks = (date: Date, weeks: number): Date => {
  return addDays(date, weeks * 7);
};

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const addYears = (date: Date, years: number): Date => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

// Date comparisons
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const isSameWeek = (date1: Date, date2: Date): boolean => {
  const startOfWeek1 = getStartOfWeek(date1);
  const startOfWeek2 = getStartOfWeek(date2);
  return isSameDay(startOfWeek1, startOfWeek2);
};

export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
};

export const isSameYear = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear();
};

// Date range helpers
export const getStartOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const getEndOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

export const getStartOfWeek = (date: Date, startDay = 0): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < startDay ? 7 : 0) + day - startDay;
  result.setDate(result.getDate() - diff);
  return getStartOfDay(result);
};

export const getEndOfWeek = (date: Date, startDay = 0): Date => {
  const startOfWeek = getStartOfWeek(date, startDay);
  return getEndOfDay(addDays(startOfWeek, 6));
};

export const getStartOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setDate(1);
  return getStartOfDay(result);
};

export const getEndOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  return getEndOfDay(result);
};

export const getStartOfYear = (date: Date): Date => {
  const result = new Date(date);
  result.setMonth(0, 1);
  return getStartOfDay(result);
};

export const getEndOfYear = (date: Date): Date => {
  const result = new Date(date);
  result.setMonth(11, 31);
  return getEndOfDay(result);
};

// Date range generators
export const getDaysInRange = (startDate: Date, endDate: Date): Date[] => {
  const days: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
};

export const getWeeksInRange = (startDate: Date, endDate: Date): Date[] => {
  const weeks: Date[] = [];
  let currentWeek = getStartOfWeek(startDate);
  
  while (currentWeek <= endDate) {
    weeks.push(new Date(currentWeek));
    currentWeek = addWeeks(currentWeek, 1);
  }
  
  return weeks;
};

export const getMonthsInRange = (startDate: Date, endDate: Date): Date[] => {
  const months: Date[] = [];
  let currentMonth = getStartOfMonth(startDate);
  
  while (currentMonth <= endDate) {
    months.push(new Date(currentMonth));
    currentMonth = addMonths(currentMonth, 1);
  }
  
  return months;
};

// Business day calculations
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

export const isWeekday = (date: Date): boolean => {
  return !isWeekend(date);
};

export const getNextBusinessDay = (date: Date): Date => {
  let nextDay = addDays(date, 1);
  while (isWeekend(nextDay)) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
};

export const getPreviousBusinessDay = (date: Date): Date => {
  let prevDay = addDays(date, -1);
  while (isWeekend(prevDay)) {
    prevDay = addDays(prevDay, -1);
  }
  return prevDay;
};

export const getBusinessDaysInRange = (startDate: Date, endDate: Date): Date[] => {
  return getDaysInRange(startDate, endDate).filter(isWeekday);
};

// Date parsing and validation
export const parseDate = (dateString: string): Date | null => {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

export const isValidDateString = (dateString: string): boolean => {
  return parseDate(dateString) !== null;
};

// Age calculation
export const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Duration calculations
export const getDurationBetween = (
  startDate: Date,
  endDate: Date
): {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} => {
  const diffInMs = endDate.getTime() - startDate.getTime();
  
  const seconds = Math.floor(diffInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  return {
    years,
    months: months % 12,
    days: days % 30,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
  };
};

// Timezone utilities
export const getTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const convertToTimezone = (date: Date, timezone: string): Date => {
  return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
};

// Date range presets
export const getDateRangePresets = () => {
  const today = new Date();
  const yesterday = addDays(today, -1);
  const lastWeek = addDays(today, -7);
  const lastMonth = addMonths(today, -1);
  const lastQuarter = addMonths(today, -3);
  const lastYear = addYears(today, -1);
  
  return {
    today: { start: getStartOfDay(today), end: getEndOfDay(today) },
    yesterday: { start: getStartOfDay(yesterday), end: getEndOfDay(yesterday) },
    thisWeek: { start: getStartOfWeek(today), end: getEndOfWeek(today) },
    lastWeek: { start: getStartOfWeek(lastWeek), end: getEndOfWeek(lastWeek) },
    thisMonth: { start: getStartOfMonth(today), end: getEndOfMonth(today) },
    lastMonth: { start: getStartOfMonth(lastMonth), end: getEndOfMonth(lastMonth) },
    thisQuarter: { start: getStartOfMonth(addMonths(today, -2)), end: getEndOfMonth(today) },
    lastQuarter: { start: getStartOfMonth(lastQuarter), end: getEndOfMonth(addMonths(lastQuarter, 2)) },
    thisYear: { start: getStartOfYear(today), end: getEndOfYear(today) },
    lastYear: { start: getStartOfYear(lastYear), end: getEndOfYear(lastYear) },
    last7Days: { start: getStartOfDay(lastWeek), end: getEndOfDay(today) },
    last30Days: { start: getStartOfDay(addDays(today, -30)), end: getEndOfDay(today) },
    last90Days: { start: getStartOfDay(addDays(today, -90)), end: getEndOfDay(today) },
  };
};