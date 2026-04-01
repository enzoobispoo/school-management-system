export type AiIntent =
  | "TOTAL_STUDENTS"
  | "TOTAL_ACTIVE_STUDENTS"
  | "TOTAL_ACTIVE_ENROLLMENTS"
  | "TOTAL_OVERDUE_PAYMENTS"
  | "TOTAL_PENDING_PAYMENTS"
  | "MONTHLY_REVENUE"
  | "MONTHLY_FINANCIAL_SUMMARY"
  | "TOP_COURSES"
  | "UPCOMING_EVENTS"
  | "LIST_OVERDUE_STUDENTS"
  | "LIST_OVERDUE_PAYMENTS"
  | "GENERATE_MONTHLY_PAYMENTS"
  | "MARK_PAYMENT_PAID"
  | "CHAT";

export interface AiClassificationResult {
  intent: AiIntent;
  confidence: number;
}

export interface PaymentActionParams {
  studentName?: string;
  paymentMethod?: string;
}

export interface AiSuggestion {
  label: string;
  prompt: string;
}

export interface AiActionResult {
  message: string;
  suggestions?: AiSuggestion[];
  executed?: boolean;
}