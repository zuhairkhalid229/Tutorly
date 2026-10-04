import { useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Github, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo, PersonAvatar } from "@/components/common";
import { dashboardPath, useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const GITHUB_URL = "https://github.com/zuhairkhalid229/Tutorly";
export const AUTHOR_URL = "https://www.linkedin.com/in/zuhairkhalid";

const NAV = [
  { to: "/tutors", label: "Find a tutor" },
  { to: "/subjects", label: "Subjects" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
];

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="tutorly-container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                    isActive && "text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <PersonAvatar name={user.name} src={user.profileImage} className="h-8 w-8 text-xs" />
                <span className="text-sm font-medium">{user.name.split(" ")[0]}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="font-semibold">{user.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(dashboardPath(user.role))}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/register/student">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 hover:bg-muted md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t bg-background md:hidden">
          <nav className="tutorly-container flex flex-col gap-1 py-3" aria-label="Mobile">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 font-medium hover:bg-muted">
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {user ? (
                <>
                  <Button variant="outline" asChild>
                    <Link to={dashboardPath(user.role)}>Dashboard</Link>
                  </Button>
                  <Button variant="ghost" onClick={signOut}>
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/register/student">Get started</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t bg-ink text-white/70">
      <div className="tutorly-container grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Every tutor on Tutorly passed an AI-generated test in each subject they teach. Tutorly is a portfolio project:
            the tutors are sample profiles and no payments are taken.
          </p>
        </div>
        <FooterColumn
          title="Learn"
          links={[["/tutors", "Find a tutor"], ["/subjects", "Subjects"], ["/how-it-works", "How it works"], ["/faqs", "FAQs"]]}
        />
        <FooterColumn
          title="Teach"
          links={[["/register/tutor", "Become a tutor"], ["/how-it-works#verification", "AI verification"], ["/login", "Sign in"]]}
        />
        <FooterColumn
          title="Project"
          links={[["/about", "About Tutorly"], ["/contact", "Contact"], ["/privacy", "Privacy"], ["/terms", "Terms"]]}
        />
      </div>
      <div className="border-t border-white/10">
        <div className="tutorly-container flex flex-col gap-2 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>
            Built by{" "}
            <a href={AUTHOR_URL} target="_blank" rel="noreferrer" className="font-semibold text-white hover:underline">
              Zuhair Khalid
            </a>
          </span>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-white">
            <Github className="h-4 w-4" /> Source on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SetupNotice() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-950">
      Supabase isn't configured. Copy <code>.env.example</code> to <code>.env.local</code> and add your project keys.
    </div>
  );
}

const MainLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen flex-col">
    <SetupNotice />
    <NavBar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default MainLayout;
