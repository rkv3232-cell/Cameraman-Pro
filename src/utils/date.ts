import { format as dateFnsFormat } from "date-fns";

export const normalizeFirestoreDate = (date: any): Date | null => {
  try {
    if (!date) return null;

    if (date?.toDate) {
      return date.toDate();
    }

    if (date instanceof Date) {
      return date;
    }

    if (typeof date === "string") {
      // Handles both "YYYY-MM-DD" and "DD/MM/YYYY" parsing attempts safely
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) return parsed;
      
      // Fallback for custom formats like "DD/MM/YYYY"
      const parts = date.split('/');
      if (parts.length === 3) {
         const customParsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
         if (!isNaN(customParsed.getTime())) return customParsed;
      }
      return null;
    }

    return null;
  } catch {
    return null;
  }
};


/**
 * Safely converts any date input (Firestore Timestamp, Date object, or string)
 * to a valid JavaScript Date object. Returns current date as fallback.
 */
export function toSafeDate(dateInput: any): Date {
    const normalized = normalizeFirestoreDate(dateInput);
    return normalized || new Date();
}

/**
 * Safely formats a date using date-fns.
 * Handles invalid dates by falling back to current date before formatting.
 */
export function safeFormat(dateInput: any, formatStr: string): string {
    const d = toSafeDate(dateInput);
    return dateFnsFormat(d, formatStr);
}
