
import { Heading } from "@/components/ui/heading";
import MainLayout from "@/components/layouts/MainLayout";

const PrivacyPage = () => {
  return (
    <MainLayout>
      <div className="container max-w-4xl py-12">
        <Heading 
          title="Privacy Policy" 
          description="Last updated: May 3, 2025"
        />
        
        <div className="mt-8 space-y-6 text-gray-700">
          <p className="font-medium">
            At Tutorly, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, 
            and safeguard your information when you visit our website or use our service.
          </p>
          
          <h2 className="text-2xl font-bold">1. Information We Collect</h2>
          <p>
            <strong>Personal Information:</strong> We collect personal information that you voluntarily provide to us when registering for the Service, 
            including but not limited to your name, email address, phone number, and profile picture.
          </p>
          <p>
            <strong>Academic Information:</strong> For tutors, we collect information about your educational background, subject matter expertise, 
            and teaching experience. For students, we may collect information about your academic needs and goals.
          </p>
          <p>
            <strong>Payment Information:</strong> We collect payment information when you book a tutoring session or add funds to your account.
          </p>
          <p>
            <strong>Usage Data:</strong> We may collect information about how you access and use our Service, including your IP address, browser type, 
            time spent on pages, and pages visited.
          </p>
          
          <h2 className="text-2xl font-bold">2. How We Use Your Information</h2>
          <p>We may use the information we collect for various purposes, including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and maintain our Service</li>
            <li>To match students with appropriate tutors</li>
            <li>To process payments and refunds</li>
            <li>To communicate with you about your account or bookings</li>
            <li>To improve our Service and user experience</li>
            <li>To enforce our terms and policies</li>
            <li>To respond to legal requests and prevent harm</li>
          </ul>
          
          <h2 className="text-2xl font-bold">3. How We Share Your Information</h2>
          <p>We may share your information with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Tutors and students as necessary to facilitate tutoring sessions</li>
            <li>Payment processors to facilitate transactions</li>
            <li>Service providers who perform services on our behalf</li>
            <li>Legal authorities when required by law</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>
          
          <h2 className="text-2xl font-bold">4. Data Security</h2>
          <p>
            We have implemented appropriate technical and organizational security measures designed to protect the security of any personal 
            information we process. However, please also remember that no method of transmission over the Internet or method of electronic 
            storage is 100% secure.
          </p>
          
          <h2 className="text-2xl font-bold">5. Your Data Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access the personal information we have about you</li>
            <li>Correct any inaccurate information</li>
            <li>Delete your personal information</li>
            <li>Object to or restrict the processing of your information</li>
            <li>Data portability</li>
          </ul>
          <p>To exercise these rights, please contact us at privacy@tutorly.com.</p>
          
          <h2 className="text-2xl font-bold">6. Children's Privacy</h2>
          <p>
            Our Service is not directed to anyone under the age of 13. If you are a parent or guardian and you are aware that your child has 
            provided us with personal information, please contact us so that we can take necessary actions.
          </p>
          
          <h2 className="text-2xl font-bold">7. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page 
            and updating the "Last updated" date.
          </p>
          
          <h2 className="text-2xl font-bold">8. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at privacy@tutorly.com.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default PrivacyPage;
