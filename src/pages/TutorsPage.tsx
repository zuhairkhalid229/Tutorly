
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const TutorsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setIsLoading(true);
        const tutorsData = await getTutors();
        setTutors(tutorsData);
      } catch (error) {
        console.error("Failed to fetch tutors:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTutors();
  }, []);

  // Filter tutors based on search term, subject, and price range
  const filteredTutors = tutors.filter((tutor) => {
    const matchesSearch =
      searchTerm === "" ||
      tutor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tutor.subjects && tutor.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (tutor.about && tutor.about.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSubject =
      selectedSubject === "all" || 
      (tutor.subjects && tutor.subjects.includes(selectedSubject));

    let matchesPrice = true;
    if (priceRange === "under-30") {
      matchesPrice = tutor.hourly_rate < 30;
    } else if (priceRange === "30-40") {
      matchesPrice = tutor.hourly_rate >= 30 && tutor.hourly_rate <= 40;
    } else if (priceRange === "over-40") {
      matchesPrice = tutor.hourly_rate > 40;
    }

    return matchesSearch && matchesSubject && matchesPrice;
  });

  return (
    <MainLayout>
      <div className="py-10">
        <div className="tutorly-container mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-tutorly-primary mb-4">
              Browse Our Popular Tutors
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              All our tutors are vetted through our AI testing system to ensure they have the expertise to help you succeed.
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search by name, subject, or keyword"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      value={selectedSubject}
                      onValueChange={setSelectedSubject}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Biology">Biology</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price Range</Label>
                    <Select
                      value={priceRange}
                      onValueChange={setPriceRange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Prices" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Prices</SelectItem>
                        <SelectItem value="under-30">Under $30/hr</SelectItem>
                        <SelectItem value="30-40">$30-$40/hr</SelectItem>
                        <SelectItem value="over-40">Over $40/hr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subject Tabs */}
          <Tabs defaultValue="all" className="mb-8">
            <div className="flex justify-center">
              <TabsList>
                <TabsTrigger value="all" onClick={() => setSelectedSubject("all")}>
                  All
                </TabsTrigger>
                <TabsTrigger value="Mathematics" onClick={() => setSelectedSubject("Mathematics")}>
                  Mathematics
                </TabsTrigger>
                <TabsTrigger value="Science" onClick={() => setSelectedSubject("Science")}>
                  Science
                </TabsTrigger>
                <TabsTrigger value="Computer Science" onClick={() => setSelectedSubject("Computer Science")}>
                  Computer Science
                </TabsTrigger>
                <TabsTrigger value="Humanities" onClick={() => setSelectedSubject("Humanities")}>
                  Humanities
                </TabsTrigger>
                <TabsTrigger value="Languages" onClick={() => setSelectedSubject("Languages")}>
                  Languages
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          {/* Tutors Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-tutorly-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading tutors...</p>
            </div>
          ) : filteredTutors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredTutors.map((tutor) => (
                <Card key={tutor.id} className="hover:shadow-lg transition-shadow h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex flex-col items-center text-center mb-4">
                      <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={tutor.profile_image} alt={tutor.full_name} />
                        <AvatarFallback>{tutor.full_name?.charAt(0) || 'T'}</AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-semibold mb-1">{tutor.full_name}</h3>
                      <p className="text-gray-600 mb-2">{tutor.subjects?.join(", ")}</p>
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
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{tutor.about || "No bio available"}</p>
                    
                    <div className="mt-auto">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold text-tutorly-accent">
                          ${tutor.hourly_rate}/hr
                        </span>
                      </div>
                      <Button 
                        asChild 
                        className="w-full hover:bg-tutorly-secondary"
                      >
                        <Link to={`/tutor/${tutor.id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="rounded-full bg-gray-100 h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">No tutors found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search filters to find more tutors.
              </p>
              <Button onClick={() => {
                setSearchTerm("");
                setSelectedSubject("all");
                setPriceRange("all");
              }}>
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default TutorsPage;
