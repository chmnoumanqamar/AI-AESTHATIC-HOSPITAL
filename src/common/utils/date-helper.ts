export const normalizeDateString = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date input provided');
  }
  return date.toISOString().split('T')[0];
};

export const isToday = (dateInput: string | Date): boolean => {
  const target = normalizeDateString(dateInput);
  const today = normalizeDateString(new Date());
  return target === today;
};

export const getIsoTimestamp = (): string => {
  return new Date().toISOString();
};
