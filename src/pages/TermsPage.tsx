
import { Heading } from "@/components/ui/heading";
import MainLayout from "@/components/layouts/MainLayout";

const TermsPage = () => {
  return (
    <MainLayout>
      <div className="container max-w-4xl py-12">
        <Heading 
          title="Terms of Service" 
          description="Last updated: May 3, 2025"
        />
        
        <div className="mt-8 space-y-6 text-gray-700">
          <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Tutorly website and services ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
            If you disagree with any part of the terms, you do not have permission to access the Service.
          </p>
          
          <h2 className="text-2xl font-bold">2. Description of Service</h2>
          <p>
            Tutorly provides an online platform connecting students with tutors for educational purposes. The Service includes the website, 
            messaging systems, booking systems, and payment processing.
          </p>
          
          <h2 className="text-2xl font-bold">3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a 
            breach of the Terms, which may result in immediate termination of your account on our Service.
          </p>
          <p>
            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
          </p>
          
          <h2 className="text-2xl font-bold">4. Tutors</h2>
          <p>
            Tutors on Tutorly are independent contractors and not employees of Tutorly. Tutorly is not responsible for the quality, safety, 
            or legality of the tutoring services provided.
          </p>
          <p>
            Tutors are responsible for accurately representing their qualifications, experience, and subject matter expertise.
          </p>
          
          <h2 className="text-2xl font-bold">5. Students</h2>
          <p>
            Students agree to attend scheduled sessions, treat tutors with respect, and pay for services as agreed upon through the platform.
          </p>
          
          <h2 className="text-2xl font-bold">6. Payments and Fees</h2>
          <p>
            All payments are processed through our platform. Tutorly charges a service fee for facilitating the connection between 
            students and tutors. All fees are clearly disclosed at the time of booking.
          </p>
          <p>
            Refunds may be issued in accordance with our Refund Policy, which forms part of these Terms.
          </p>
          
          <h2 className="text-2xl font-bold">7. Cancellations</h2>
          <p>
            Sessions may be cancelled according to our Cancellation Policy. Typically, cancellations made with less than 24 hours notice may 
            incur a fee of up to 50% of the session cost. Cancellations made with less than 1 hour notice may incur a fee of up to 100% of the session cost.
          </p>
          
          <h2 className="text-2xl font-bold">8. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned by Tutorly and are protected by international 
            copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
          
          <h2 className="text-2xl font-bold">9. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including 
            without limitation if you breach the Terms.
          </p>
          
          <h2 className="text-2xl font-bold">10. Limitation of Liability</h2>
          <p>
            In no event shall Tutorly, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, 
            incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other 
            intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>
          
          <h2 className="text-2xl font-bold">11. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our 
            Service after those revisions become effective, you agree to be bound by the revised terms.
          </p>
          
          <h2 className="text-2xl font-bold">12. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at support@tutorly.com.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default TermsPage;
