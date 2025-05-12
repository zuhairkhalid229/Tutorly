
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAITest, submitTestAnswers, getAvailableSubjects } from "@/services/ai-test.service";
import { Heading } from "@/components/ui/heading";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
}

interface TestData {
  subject: string;
  questions: Question[];
}

interface TestResult {
  score: number;
  passed: boolean;
  feedback: string;
}

const AITestPage = () => {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [testData, setTestData] = useState<TestData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoadingTest, setIsLoadingTest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [verifiedSubjects, setVerifiedSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchAvailableSubjects();
    }
  }, [user]);

  const fetchAvailableSubjects = async () => {
    try {
      const { availableSubjects, verifiedSubjects } = await getAvailableSubjects(user!.id);
      setAvailableSubjects(availableSubjects);
      setVerifiedSubjects(verifiedSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleGetTest = async () => {
    if (!selectedSubject) {
      toast({
        title: "Please select a subject",
        description: "You need to select a subject to take the test",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingTest(true);
    setTestData(null);
    setAnswers({});
    setTestResult(null);

    try {
      const data = await getAITest(selectedSubject);
      setTestData(data);
    } catch (error) {
      console.error("Error getting test:", error);
    } finally {
      setIsLoadingTest(false);
    }
  };

  const handleSubmitTest = async () => {
    if (!testData || !user?.id) return;

    // Check if all questions have been answered
    const unansweredQuestions = testData.questions.filter(
      (q) => !answers[q.id]
    );

    if (unansweredQuestions.length > 0) {
      toast({
        title: "Please answer all questions",
        description: `You still have ${unansweredQuestions.length} unanswered questions`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare correct answers object
      const correctAnswers: Record<string, string> = {};
      testData.questions.forEach((q) => {
        correctAnswers[q.id] = q.correctAnswer;
      });

      const result = await submitTestAnswers(
        user.id,
        testData.subject,
        answers,
        correctAnswers
      );

      setTestResult(result);

      // If passed, update our local list of verified subjects
      if (result.passed) {
        if (!verifiedSubjects.includes(testData.subject)) {
          setVerifiedSubjects([...verifiedSubjects, testData.subject]);
        }
        // Update available subjects
        setAvailableSubjects(availableSubjects.filter(s => s !== testData.subject));
      }
    } catch (error) {
      console.error("Error submitting test:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTestData(null);
    setAnswers({});
    setTestResult(null);
    setSelectedSubject("");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Heading
        title="AI Tutor Verification"
        description="Complete subject tests to verify your expertise and start teaching"
      />

      {verifiedSubjects.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Verified Subjects</CardTitle>
            <CardDescription>
              You are verified to teach the following subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {verifiedSubjects.map((subject) => (
                <span
                  key={subject}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {subject}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!testData ? (
        <Card>
          <CardHeader>
            <CardTitle>Take a Subject Test</CardTitle>
            <CardDescription>
              Select a subject to test your knowledge and get verified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No subjects available for verification
                      </SelectItem>
                    ) : (
                      availableSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGetTest}
              disabled={!selectedSubject || isLoadingTest}
            >
              {isLoadingTest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Test...
                </>
              ) : (
                "Start Test"
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{testData.subject} Assessment</CardTitle>
            <CardDescription>
              Answer all questions to complete the assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResult ? (
              <div className={`p-6 rounded-lg ${testResult.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h3 className={`text-xl font-bold ${testResult.passed ? 'text-green-700' : 'text-red-700'}`}>
                  {testResult.passed ? 'Congratulations!' : 'Assessment Not Passed'}
                </h3>
                <p className="mt-2">{testResult.feedback}</p>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${testResult.passed ? 'bg-green-600' : 'bg-red-600'}`} 
                      style={{ width: `${testResult.score}%` }}
                    ></div>
                  </div>
                  <p className="text-center mt-1 text-sm font-medium">Score: {testResult.score}%</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {testData.questions.map((question, index) => (
                  <div key={question.id} className="space-y-4">
                    <h3 className="font-medium">
                      {index + 1}. {question.question}
                    </h3>
                    <RadioGroup
                      value={answers[question.id] || ""}
                      onValueChange={(value) =>
                        handleAnswerChange(question.id, value)
                      }
                    >
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50"
                          >
                            <RadioGroupItem
                              value={option.id}
                              id={`${question.id}-${option.id}`}
                            />
                            <Label
                              htmlFor={`${question.id}-${option.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              {option.id}. {option.text}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              {testResult ? "Take Another Test" : "Cancel"}
            </Button>
            {!testResult && (
              <Button onClick={handleSubmitTest} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Assessment"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default AITestPage;
