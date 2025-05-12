
import { Heading } from "@/components/ui/heading";
import MainLayout from "@/components/layouts/MainLayout";

const AboutPage = () => {
  return (
    <MainLayout>
      <div className="container max-w-4xl py-12">
        <Heading 
          title="About Tutorly" 
          description="Connecting students with expert tutors for personalized learning experiences"
        />
        
        <div className="mt-8 space-y-6 text-gray-700">
          <p>
            Welcome to Tutorly, the premier online platform dedicated to connecting students with qualified tutors across a wide range of subjects. 
            Founded in 2025, we're committed to making quality education accessible to everyone through personalized, one-on-one tutoring sessions.
          </p>
          
          <h3 className="text-xl font-semibold mt-8">Our Mission</h3>
          <p>
            At Tutorly, we believe that personalized education is the key to academic success. Our mission is to create a seamless connection 
            between students seeking academic support and qualified tutors who can provide tailored instruction to meet individual learning needs.
          </p>
          
          <h3 className="text-xl font-semibold mt-8">How It Works</h3>
          <p>
            Our platform makes it simple to find the right tutor for your needs. Students can browse profiles, check qualifications and reviews, 
            and book sessions directly through our intuitive interface. Tutors can manage their schedule, communicate with students, and build 
            their online teaching presence.
          </p>
          
          <h3 className="text-xl font-semibold mt-8">Our Team</h3>
          <p>
            Tutorly was created by a team of educators and technology specialists who recognized the need for a better way to connect students 
            with tutors. Our diverse team brings together expertise in education, software development, and user experience design to create 
            a platform that truly serves the needs of our community.
          </p>
          
          <h3 className="text-xl font-semibold mt-8">Join Our Community</h3>
          <p>
            Whether you're a student looking for academic support or a tutor wanting to share your knowledge, we invite you to join the Tutorly 
            community today. Together, we're transforming how education is delivered and received in the digital age.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default AboutPage;
