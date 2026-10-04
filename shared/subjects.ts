// One list for the browser, the API and the seed script.
export const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "Literature",
  "History",
  "Geography",
  "Economics",
  "Business Studies",
  "Psychology",
  "Urdu",
  "French",
  "Spanish",
] as const;

export type Subject = (typeof SUBJECTS)[number];

export const isSubject = (value: unknown): value is Subject =>
  typeof value === "string" && (SUBJECTS as readonly string[]).includes(value);

/** Score needed to pass a verification test, in percent. */
export const PASS_MARK = 75;
/** Questions per verification test. */
export const QUESTIONS_PER_TEST = 8;
/** Minutes a tutor has to submit a test after starting it. */
export const TEST_TIME_LIMIT_MINUTES = 30;
