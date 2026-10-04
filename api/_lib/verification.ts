import { randomInt } from "node:crypto";
import { PASS_MARK, QUESTIONS_PER_TEST } from "../../shared/subjects.js";
import type { Schema } from "./gemini.js";

const LETTERS = ["A", "B", "C", "D"] as const;
type Letter = (typeof LETTERS)[number];

/** What the model returns. */
export interface RawQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  topic?: string;
}

/** What we store. Never sent to the browser before the test is submitted. */
export interface StoredQuestion {
  id: string;
  question: string;
  options: { id: Letter; text: string }[];
  correct: Letter;
  explanation: string;
  topic: string;
}

export type PublicQuestion = Omit<StoredQuestion, "correct" | "explanation">;

/** Ask for a few spare questions: some get dropped by validation or the answer check. */
export const QUESTIONS_TO_GENERATE = QUESTIONS_PER_TEST + 3;
export const MIN_USABLE_QUESTIONS = 6;

export const generationSchema: Schema = {
  type: "OBJECT",
  properties: {
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          topic: { type: "STRING", description: "Sub-topic this question covers, 1-4 words" },
          question: { type: "STRING" },
          options: { type: "ARRAY", items: { type: "STRING" }, minItems: 4, maxItems: 4 },
          correct_index: { type: "INTEGER", description: "0-based index of the single correct option" },
          explanation: { type: "STRING", description: "One or two sentences on why the answer is right" },
        },
        required: ["topic", "question", "options", "correct_index", "explanation"],
      },
    },
  },
  required: ["questions"],
};

export const generationSystemPrompt = `You write screening tests for tutors on Tutorly, an online tutoring marketplace.
A tutor who passes may teach the subject to secondary-school and first-year university students.

Rules for every question:
- Test understanding a good tutor needs, not trivia, dates of birth or obscure names.
- Exactly four options. Exactly one is correct, and an expert would agree without debate.
- Wrong options must be plausible: use mistakes students really make.
- Never use "all of the above", "none of the above" or "both A and B".
- Don't make the correct option the longest one.
- Keep each question under 60 words. Use plain text; write maths inline like x^2 + 3x.

Across the test: cover different sub-topics, mix recall of core ideas, short applied problems,
and common misconceptions a tutor has to be able to explain.`;

export function generationPrompt(subject: string, nonce: string) {
  return `Write ${QUESTIONS_TO_GENERATE} multiple-choice questions for a ${subject} tutor screening test.
Vary the sub-topics so this test differs from previous ones (variation seed: ${nonce}).`;
}

export const answerCheckSchema: Schema = {
  type: "OBJECT",
  properties: {
    answers: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          answer_index: { type: "INTEGER", description: "0-based index of the option you believe is correct" },
        },
        required: ["id", "answer_index"],
      },
    },
  },
  required: ["answers"],
};

export const answerCheckSystemPrompt = `You are an expert examiner. Answer each multiple-choice question.
Work each one out carefully and independently. Return the 0-based index of the correct option for every question id.`;

export function answerCheckPrompt(subject: string, questions: RawQuestion[]) {
  const payload = questions.map((q, i) => ({ id: String(i), question: q.question, options: q.options }));
  return `${subject} questions:\n${JSON.stringify(payload)}`;
}

/** Drops malformed questions from the model's output. */
export function validQuestions(raw: unknown): RawQuestion[] {
  const list = (raw as { questions?: unknown })?.questions;
  if (!Array.isArray(list)) return [];
  return list.filter((q): q is RawQuestion => {
    if (!q || typeof q !== "object") return false;
    const { question, options, correct_index, explanation } = q as RawQuestion;
    if (typeof question !== "string" || !question.trim() || question.length > 600) return false;
    if (!Array.isArray(options) || options.length !== 4) return false;
    if (options.some((o) => typeof o !== "string" || !o.trim() || o.length > 300)) return false;
    if (new Set(options.map((o) => o.trim().toLowerCase())).size !== 4) return false;
    if (!Number.isInteger(correct_index) || correct_index < 0 || correct_index > 3) return false;
    return typeof explanation === "string";
  });
}

/** Keeps only questions where an independent solve agrees with the answer key. */
export function keepAgreed(questions: RawQuestion[], check: unknown): RawQuestion[] {
  const answers = (check as { answers?: { id: string; answer_index: number }[] })?.answers;
  if (!Array.isArray(answers)) return [];
  const byId = new Map(answers.map((a) => [String(a.id), a.answer_index]));
  return questions.filter((q, i) => byId.get(String(i)) === q.correct_index);
}

/** Shuffles options (models put the right answer first far too often) and assigns ids. */
export function finalizeQuestions(
  questions: RawQuestion[],
  rand: (max: number) => number = randomInt,
): StoredQuestion[] {
  return questions.slice(0, QUESTIONS_PER_TEST).map((q, i) => {
    const order = [0, 1, 2, 3];
    for (let j = order.length - 1; j > 0; j--) {
      const k = rand(j + 1);
      [order[j], order[k]] = [order[k], order[j]];
    }
    const options = order.map((from, to) => ({ id: LETTERS[to], text: q.options[from].trim() }));
    return {
      id: `q${i + 1}`,
      question: q.question.trim(),
      options,
      correct: LETTERS[order.indexOf(q.correct_index)],
      explanation: q.explanation.trim(),
      topic: (q.topic ?? "").trim(),
    };
  });
}

export const toPublic = (questions: StoredQuestion[]): PublicQuestion[] =>
  questions.map(({ id, question, options, topic }) => ({ id, question, options, topic }));

export function grade(questions: StoredQuestion[], answers: Record<string, unknown>) {
  const review = questions.map((q) => {
    const chosen = typeof answers[q.id] === "string" ? (answers[q.id] as string) : null;
    return { ...q, chosen, isCorrect: chosen === q.correct };
  });
  const correctCount = review.filter((r) => r.isCorrect).length;
  const score = Math.round((100 * correctCount) / questions.length);
  return { score, passed: score >= PASS_MARK, correctCount, total: questions.length, review };
}
