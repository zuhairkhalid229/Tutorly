import { callApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { VerificationAttempt } from "@/types/database";

export interface TestQuestion {
  id: string;
  question: string;
  topic: string;
  options: { id: string; text: string }[];
}

export interface StartedTest {
  attemptId: string;
  subject: string;
  questions: TestQuestion[];
  startedAt: string;
  timeLimitMinutes: number;
  passMark: number;
}

export interface TestResult {
  subject: string;
  score: number;
  passed: boolean;
  correctCount: number;
  total: number;
  subjects: string[];
  review: (TestQuestion & { correct: string; explanation: string; chosen: string | null; isCorrect: boolean })[];
}

export const startTest = (subject: string) => callApi<StartedTest>("verification/start", { subject });

export const submitTest = (attemptId: string, answers: Record<string, string>) =>
  callApi<TestResult>("verification/submit", { attemptId, answers });

export async function myAttempts(): Promise<VerificationAttempt[]> {
  const { data, error } = await supabase
    .from("verification_attempts")
    .select("id, tutor_id, subject, score, passed, model, created_at, submitted_at")
    .not("submitted_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as VerificationAttempt[];
}
