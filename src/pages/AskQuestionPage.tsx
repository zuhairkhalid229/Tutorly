
import { useState } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { Link } from "react-router-dom";

const AskQuestionPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    question: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast.success("Your question has been submitted! We'll respond shortly.");
      setFormData({
        name: "",
        email: "",
        category: "",
        question: "",
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const commonQuestions = [
    {
      id: 1,
      question: "How do I reset my password?",
      answer: "To reset your password, go to the login page and click on 'Forgot Password'. Follow the instructions sent to your email to create a new password."
    },
    {
      id: 2,
      question: "Can I change my tutor after booking?",
      answer: "Yes, you can change your tutor before the session starts. Go to your bookings page, select the booking, and click on 'Change Tutor' to make the switch."
    },
    {
      id: 3,
      question: "Where can I see my past tutoring sessions?",
      answer: "All your past tutoring sessions are available in your dashboard under the 'History' tab. You can access details, notes, and recordings from previous sessions there."
    },
    {
      id: 4,
      question: "How do I report an issue with a tutor?",
      answer: "If you experience any issues with a tutor, please go to their profile and click on the 'Report' button. Alternatively, you can contact our support team directly from the Contact page."
    },
    {
      id: 5,
      question: "Can I get a refund if I'm not satisfied?",
      answer: "Tutorly offers a satisfaction guarantee. If you're not satisfied with your tutoring session, please contact our support team within 24 hours of the session, and we'll review your case for a potential refund."
    }
  ];

  return (
    <MainLayout>
      <div className="tutorly-container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-tutorly-primary mb-2">
            Ask a Question
          </h1>
          <p className="text-center text-gray-600 mb-12">
            Can't find what you're looking for? Submit your question and our team will get back to you.
          </p>

          <Tabs defaultValue="ask" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ask">Ask a Question</TabsTrigger>
              <TabsTrigger value="common">Common Questions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ask" className="pt-6">
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Question Category</Label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md"
                        required
                      >
                        <option value="">Select a category</option>
                        <option value="account">Account & Registration</option>
                        <option value="booking">Booking & Scheduling</option>
                        <option value="payment">Payments & Billing</option>
                        <option value="tutoring">Tutoring Sessions</option>
                        <option value="technical">Technical Issues</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="question">Your Question</Label>
                      <textarea
                        id="question"
                        name="question"
                        value={formData.question}
                        onChange={handleChange}
                        rows={5}
                        className="w-full min-h-[150px] p-2 border rounded-md"
                        placeholder="Please provide as much detail as possible..."
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Question"}
                    </Button>

                    <p className="text-sm text-gray-500 text-center mt-4">
                      By submitting this form, you agree to our{" "}
                      <Link to="/terms" className="text-tutorly-accent hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-tutorly-accent hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="common" className="pt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {commonQuestions.map((item) => (
                      <div key={item.id} className="border-b pb-4 last:border-0">
                        <h3 className="font-semibold text-tutorly-primary mb-2">
                          {item.question}
                        </h3>
                        <p className="text-gray-600">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 text-center">
                    <p className="mb-4 text-gray-600">
                      Don't see your question here? Check our{" "}
                      <Link to="/faqs" className="text-tutorly-accent hover:underline">
                        FAQs page
                      </Link>{" "}
                      for more answers or submit your own question.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default AskQuestionPage;
