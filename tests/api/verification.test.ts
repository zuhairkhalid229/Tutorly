import { describe, expect, it } from "vitest";
import {
  finalizeQuestions,
  grade,
  keepAgreed,
  toPublic,
  validQuestions,
  type RawQuestion,
} from "../../api/_lib/verification";

const q = (n: number, correct = 1): RawQuestion => ({
  question: `Question ${n}?`,
  options: [`a${n}`, `b${n}`, `c${n}`, `d${n}`],
  correct_index: correct,
  explanation: "Because.",
  topic: "Algebra",
});

describe("validQuestions", () => {
  it("drops malformed questions", () => {
    const raw = {
      questions: [
        q(1),
        { ...q(2), options: ["a", "b", "c"] },
        { ...q(3), options: ["same", "Same", "c", "d"] },
        { ...q(4), correct_index: 4 },
        { ...q(5), question: "  " },
        null,
      ],
    };
    expect(validQuestions(raw).map((x) => x.question)).toEqual(["Question 1?"]);
  });

  it("survives garbage", () => {
    expect(validQuestions(undefined)).toEqual([]);
    expect(validQuestions({ questions: "nope" })).toEqual([]);
  });
});

describe("keepAgreed", () => {
  it("keeps only questions the independent solve agrees with", () => {
    const qs = [q(1, 0), q(2, 2), q(3, 3)];
    const check = { answers: [{ id: "0", answer_index: 0 }, { id: "1", answer_index: 1 }, { id: "2", answer_index: 3 }] };
    expect(keepAgreed(qs, check).map((x) => x.question)).toEqual(["Question 1?", "Question 3?"]);
  });
});

describe("finalizeQuestions", () => {
  it("shuffles options but keeps the right answer attached to the right text", () => {
    const reverse = (max: number) => 0; // always swap with the first slot
    const [f] = finalizeQuestions([q(1, 1)], reverse);
    const correctText = f.options.find((o) => o.id === f.correct)!.text;
    expect(correctText).toBe("b1");
    expect(f.options.map((o) => o.id)).toEqual(["A", "B", "C", "D"]);
    expect(f.options.map((o) => o.text).sort()).toEqual(["a1", "b1", "c1", "d1"]);
  });

  it("caps the test at 8 questions", () => {
    expect(finalizeQuestions(Array.from({ length: 11 }, (_, i) => q(i)))).toHaveLength(8);
  });

  it("puts the correct answer in every position over many shuffles", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(finalizeQuestions([q(1, 0)])[0].correct);
    expect([...seen].sort()).toEqual(["A", "B", "C", "D"]);
  });
});

describe("toPublic", () => {
  it("strips the answer key and explanations", () => {
    const pub = toPublic(finalizeQuestions([q(1)]));
    expect(JSON.stringify(pub)).not.toMatch(/correct|explanation|Because/);
  });
});

describe("grade", () => {
  const qs = finalizeQuestions(Array.from({ length: 8 }, (_, i) => q(i)));
  const allRight = Object.fromEntries(qs.map((x) => [x.id, x.correct]));

  it("passes at 75%", () => {
    const answers = { ...allRight, q1: "Z", q2: "Z" };
    expect(grade(qs, answers)).toMatchObject({ score: 75, passed: true, correctCount: 6, total: 8 });
  });

  it("fails below 75%", () => {
    const answers = { ...allRight, q1: "Z", q2: "Z", q3: "Z" };
    expect(grade(qs, answers)).toMatchObject({ score: 63, passed: false });
  });

  it("treats missing or non-string answers as wrong", () => {
    expect(grade(qs, { q1: 1 }).correctCount).toBe(0);
  });
});
