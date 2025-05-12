
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Home,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Book,
  Users,
  CreditCard
} from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardLayoutProps {
  userType: "student" | "tutor" | "admin";
}

const DashboardLayout = ({ userType }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = {
    student: [
      { to: "/student", icon: <Home className="h-5 w-5" />, label: "Dashboard" },
      { to: "/student/bookings", icon: <Calendar className="h-5 w-5" />, label: "Bookings" },
      { to: "/student/messages", icon: <MessageSquare className="h-5 w-5" />, label: "Messages" },
      { to: "/student/profile", icon: <User className="h-5 w-5" />, label: "Profile" },
    ],
    tutor: [
      { to: "/tutor", icon: <Home className="h-5 w-5" />, label: "Dashboard" },
      { to: "/tutor/bookings", icon: <Calendar className="h-5 w-5" />, label: "Bookings" },
      { to: "/tutor/messages", icon: <MessageSquare className="h-5 w-5" />, label: "Messages" },
      { to: "/tutor/profile", icon: <User className="h-5 w-5" />, label: "Profile" },
    ],
    admin: [
      { to: "/admin", icon: <Home className="h-5 w-5" />, label: "Dashboard" },
      { to: "/admin/tutors", icon: <Users className="h-5 w-5" />, label: "Tutors" },
      { to: "/admin/students", icon: <Book className="h-5 w-5" />, label: "Students" },
      { to: "/admin/payments", icon: <CreditCard className="h-5 w-5" />, label: "Payments" },
      { to: "/admin/settings", icon: <Settings className="h-5 w-5" />, label: "Settings" },
    ]
  };

  const currentNavItems = navItems[userType];
  
  const getLinkClassName = (path: string) => {
    const isActive = location.pathname === path;
    return `tutorly-sidebar-item ${isActive ? 'active' : ''}`;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-tutorly-primary">TUTORLY</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-700 focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-md">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {currentNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={getLinkClassName(item.to)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center space-x-2 p-3 rounded-md text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Sidebar for larger screens */}
      <div className="hidden md:flex md:flex-col md:w-64 bg-white shadow-sm">
        <div className="p-4">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-tutorly-primary">TUTORLY</span>
          </Link>
        </div>
        <div className="flex flex-col flex-grow p-4 space-y-2">
          {currentNavItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={getLinkClassName(item.to)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar>
              <AvatarImage src={user?.profileImage} alt={user?.name} />
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user?.name}</div>
              <div className="text-sm text-gray-500">{user?.email}</div>
            </div>
          </div>
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="w-full flex items-center justify-center space-x-2 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow p-4 md:p-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-tutorly-primary">
            Welcome back, {user?.name}!
          </h1>
        </div>
        
        {/* Main Content Area */}
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
