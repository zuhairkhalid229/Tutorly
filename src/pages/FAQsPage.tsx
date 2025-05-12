
import MainLayout from "@/components/layouts/MainLayout";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

const FAQsPage = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqs: FAQ[] = [
    {
      id: 1,
      question: "How does Tutorly verify tutors?",
      answer: "At Tutorly, we use an advanced AI-based testing system to ensure that all tutors are proficient in their subjects. Tutors must pass our comprehensive subject tests before they can be listed on the platform. This ensures that students receive high-quality tutoring from knowledgeable professionals."
    },
    {
      id: 2,
      question: "How do I book a tutor?",
      answer: "Booking a tutor on Tutorly is simple! First, search for tutors based on your subject needs. Review tutor profiles, including their qualifications, ratings, and availability. Once you've selected a tutor, choose an available time slot on their calendar and submit your booking request. After the tutor confirms, you'll proceed to payment to finalize the booking."
    },
    {
      id: 3,
      question: "What payment methods does Tutorly accept?",
      answer: "Tutorly currently accepts bank transfers as the primary payment method. After making a payment, an admin will verify the transaction before it appears on your student dashboard. This ensures secure and verified payments for all tutoring services."
    },
    {
      id: 4,
      question: "Can I message a tutor before booking?",
      answer: "Yes! Tutorly provides a chat feature that allows you to communicate with tutors before booking a session. This way, you can discuss your specific needs, ask questions about their teaching style, or clarify any concerns before making a commitment."
    },
    {
      id: 5,
      question: "How do I become a tutor on Tutorly?",
      answer: "To become a tutor on Tutorly, start by creating an account and selecting 'Register as Tutor.' You'll need to provide your educational background and subject expertise. The key step is passing our AI-based subject proficiency test. Once approved, you can set up your profile, including your availability, rates, and teaching style, to start accepting student bookings."
    },
    {
      id: 6,
      question: "What if I need to cancel a booked session?",
      answer: "If you need to cancel a session, please do so at least 24 hours in advance to receive a full refund. Cancellations made less than 24 hours before the scheduled session may be subject to a cancellation fee. You can manage all your bookings from your dashboard."
    },
    {
      id: 7,
      question: "Are tutoring sessions conducted online or in-person?",
      answer: "Tutorly primarily focuses on online tutoring sessions, which can be conducted through our integrated video conferencing platform. This allows for flexibility and convenience for both students and tutors. However, some tutors may offer in-person sessions depending on their location and preferences."
    }
  ];

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };

  return (
    <MainLayout>
      <div className="tutorly-container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-tutorly-primary mb-2">Frequently Asked Questions</h1>
          <p className="text-center text-gray-600 mb-12">Find answers to common questions about using Tutorly</p>

          <div className="space-y-6">
            {faqs.map((faq) => (
              <Collapsible
                key={faq.id}
                open={openItems.includes(faq.id)}
                onOpenChange={() => toggleItem(faq.id)}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center justify-between w-full p-4 text-left font-medium text-tutorly-primary hover:bg-blue-50 hover:text-tutorly-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ease-in-out"
                  >
                    <span>{faq.question}</span>
                    <span className="text-lg">
                      {openItems.includes(faq.id) ? "−" : "+"}
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 pt-0 text-gray-600 bg-gray-50">
                  <p>{faq.answer}</p>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>

          <div className="mt-12 text-center">
            <h2 className="text-xl font-semibold text-tutorly-primary mb-4">Still have questions?</h2>
            <p className="text-gray-600 mb-6">Our team is here to assist you with any additional questions or concerns.</p>
            <Button asChild>
              <a href="/ask-question">Ask a Question</a>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FAQsPage;
