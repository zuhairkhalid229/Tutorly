
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTutors } from "@/services/profile.service";

interface Tutor {
  id: string;
  full_name: string;
  subjects: string[];
  hourly_rate: number;
  rating: number;
  profile_image: string;
  about: string;
}

const HomePage = () => {
  const { user } = useAuth();
  const [popularTutors, setPopularTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setIsLoading(true);
        const tutors = await getTutors();
        // Get up to 4 tutors for the homepage
        setPopularTutors(tutors.slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch tutors:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTutors();
  }, []);

  const subjects = [
    { name: "Mathematics", icon: "🧮", students: 1200 },
    { name: "Computer Science", icon: "💻", students: 980 },
    { name: "Physics", icon: "⚛️", students: 850 },
    { name: "Chemistry", icon: "🧪", students: 760 },
    { name: "English Literature", icon: "📚", students: 1100 },
    { name: "History", icon: "🏛️", students: 630 },
  ];

  const testimonials = [
    {
      quote: "Tutorly helped me find the perfect math tutor who explained complex concepts in a way I could understand.",
      author: "Sarah T., Student",
      image: "https://ui-avatars.com/api/?name=Sarah+T&background=F29B38&color=fff",
    },
    {
      quote: "As a tutor on Tutorly, I've been able to connect with students who really need my help. The AI testing ensured I was matched with appropriate subjects.",
      author: "Mark R., Tutor",
      image: "https://ui-avatars.com/api/?name=Mark+R&background=1E88E5&color=fff",
    },
    {
      quote: "My daughter's grades improved dramatically after finding a tutor on Tutorly. The verification process gave me confidence in their qualifications.",
      author: "Lisa M., Parent",
      image: "https://ui-avatars.com/api/?name=Lisa+M&background=E53E51&color=fff",
    },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-tutorly-primary text-white py-16">
        <div className="tutorly-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Explore What Students Like You Are Learning The Most
              </h1>
              <p className="text-lg mb-8">
                Connect with qualified tutors who have been tested and approved by our AI-driven system.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button
                  size="lg"
                  className="bg-white text-tutorly-primary hover:bg-gray-100"
                  asChild
                >
                  <Link to="/tutors">Find Tutors</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-tutorly-primary hover:bg-white/10"
                  asChild
                >
                  <Link to="/register/tutor">Become a Tutor</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src="/uploads/2b3d702a-b204-488b-ba32-79959e4dc481.png"
                alt="Tutoring session"
                className="rounded-lg max-h-85 mx-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Educational Partners */}
      <section className="py-8 bg-white">
        <div className="tutorly-container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-70">
            <div className="text-center">
              <h4 className="text-xl font-semibold text-gray-700">Udemy</h4>
            </div>
            <div className="text-center">
              <h4 className="text-xl font-semibold text-gray-700">Khan Academy</h4>
            </div>
            <div className="text-center">
              <h4 className="text-xl font-semibold text-gray-700">Cloud Academy</h4>
            </div>
            <div className="text-center">
              <h4 className="text-xl font-semibold text-gray-700">Coursera</h4>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Courses/Subjects */}
      <section className="py-16 bg-gray-50">
        <div className="tutorly-container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-tutorly-primary">
            Popular Subjects
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
            {subjects.map((subject, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl">{subject.icon}</span>
                    <div>
                      <h3 className="text-xl font-semibold">{subject.name}</h3>
                      <p className="text-gray-600">{subject.students}+ students</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Tutors */}
      <section className="py-16 bg-white">
        <div className="tutorly-container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-tutorly-primary mb-4 md:mb-0">
              Popular Tutors
            </h2>
            <Link
              to="/tutors"
              className="text-tutorly-accent hover:underline flex items-center"
            >
              Meet Our Popular Tutors
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {isLoading ? (
              Array(4).fill(0).map((_, index) => (
                <Card key={index} className="h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center animate-pulse">
                    <div className="h-24 w-24 rounded-full bg-gray-200 mb-4"></div>
                    <div className="h-6 w-3/4 bg-gray-200 mb-1"></div>
                    <div className="h-4 w-1/2 bg-gray-200 mb-2"></div>
                    <div className="flex items-center mb-2">
                      {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-4 w-4 bg-gray-200 mx-0.5"></div>
                      ))}
                    </div>
                    <div className="h-4 w-1/3 bg-gray-200"></div>
                  </CardContent>
                </Card>
              ))
            ) : popularTutors.length > 0 ? (
              popularTutors.map((tutor) => (
                <Link to={`/tutor/${tutor.id}`} key={tutor.id}>
                  <Card className="hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={tutor.profile_image} alt={tutor.full_name} />
                        <AvatarFallback>{tutor.full_name?.charAt(0) || 'T'}</AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-semibold mb-1">{tutor.full_name}</h3>
                      <p className="text-gray-600 mb-2">{tutor.subjects?.[0] || "General Tutor"}</p>
                      <div className="flex items-center mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 ${
                              i < Math.floor(tutor.rating || 0)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-2 text-gray-600">{tutor.rating || "New"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-4 text-center py-8">
                <p className="text-gray-500">No tutors available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="tutorly-container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-tutorly-primary">
            How Tutorly Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-tutorly-light-blue h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-tutorly-accent">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Find a Tutor</h3>
              <p className="text-gray-600">
                Search our marketplace of AI-approved tutors with expertise in your subject.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-tutorly-light-blue h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-tutorly-accent">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Book a Session</h3>
              <p className="text-gray-600">
                Schedule a time that works for you and make a secure payment.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-tutorly-light-blue h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-tutorly-accent">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Learn & Succeed</h3>
              <p className="text-gray-600">
                Meet with your tutor, learn effectively, and improve your grades.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="tutorly-container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-tutorly-primary">
            What People Say About Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <svg
                      className="h-8 w-8 text-tutorly-accent mb-4"
                      fill="currentColor"
                      viewBox="0 0 32 32"
                      aria-hidden="true"
                    >
                      <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                    </svg>
                    <p className="mb-4 text-gray-600">{testimonial.quote}</p>
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={testimonial.image} alt={testimonial.author} />
                        <AvatarFallback>{testimonial.author.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium">{testimonial.author}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-tutorly-accent text-white">
        <div className="tutorly-container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already improving their grades with Tutorly's
            qualified tutors.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            {user ? (
              <Button
                size="lg"
                className="bg-white text-tutorly-accent hover:bg-gray-100"
                asChild
              >
                <Link to={`/${user.role}`}>Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="bg-white text-tutorly-accent hover:bg-gray-100"
                  asChild
                >
                  <Link to="/register/student">Register as Student</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-tutorly-accent hover:bg-white/10"
                  asChild
                >
                  <Link to="/register/tutor">Become a Tutor</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default HomePage;
