import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  CalendarDays,
  Home,
  Inbox,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { Logo, PersonAvatar } from "@/components/common";
import { SetupNotice } from "@/components/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToMessages, unreadCount } from "@/services/messages";
import type { Role } from "@/types/database";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: typeof Home; end?: boolean; badge?: "messages" };

const NAV: Record<Role, Item[]> = {
  student: [
    { to: "/student", label: "Overview", icon: Home, end: true },
    { to: "/student/bookings", label: "Lessons", icon: CalendarDays },
    { to: "/student/messages", label: "Messages", icon: MessageSquare, badge: "messages" },
    { to: "/tutors", label: "Find a tutor", icon: Search },
    { to: "/student/profile", label: "Profile", icon: UserRound },
  ],
  tutor: [
    { to: "/tutor", label: "Overview", icon: Home, end: true },
    { to: "/tutor/bookings", label: "Lessons", icon: CalendarDays },
    { to: "/tutor/messages", label: "Messages", icon: MessageSquare, badge: "messages" },
    { to: "/tutor/verification", label: "AI verification", icon: BadgeCheck },
    { to: "/tutor/profile", label: "Profile & hours", icon: UserRound },
  ],
  admin: [
    { to: "/admin", label: "Overview", icon: ShieldCheck, end: true },
    { to: "/admin/inbox", label: "Inbox", icon: Inbox },
  ],
};

export default function DashboardLayout({ role }: { role: Role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const unread = useQuery({
    queryKey: ["unread", user?.id],
    queryFn: () => unreadCount(user!.id),
    enabled: !!user && role !== "admin",
  });

  // Live badge: refresh counts whenever a message arrives.
  useEffect(() => {
    if (!user || role === "admin") return;
    return subscribeToMessages(user.id, () => {
      queryClient.invalidateQueries({ queryKey: ["unread"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["thread"] });
    });
  }, [user, role, queryClient]);

  const signOut = async () => {
    await logout();
    navigate("/");
  };

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Dashboard">
      {NAV[role].map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
              isActive && "bg-secondary text-secondary-foreground hover:bg-secondary",
            )
          }
        >
          <item.icon className="h-4 w-4" aria-hidden />
          <span className="flex-1">{item.label}</span>
          {item.badge === "messages" && !!unread.data && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{unread.data}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  const account = user && (
    <div className="border-t pt-4">
      <div className="flex items-center gap-3">
        <PersonAvatar name={user.name} src={user.profileImage} className="h-9 w-9 text-sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{user.name}</div>
          <div className="truncate text-xs capitalize text-muted-foreground">
            {user.isDemo ? `Demo ${user.role}` : user.role}
          </div>
        </div>
        <button onClick={signOut} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/40">
      <SetupNotice />
      {user?.isDemo && (
        <div className="bg-ink px-4 py-2 text-center text-xs text-white/80">
          You're using a shared demo account. Changes reset every night.{" "}
          <Link to={`/register/${role}`} className="font-semibold text-white underline underline-offset-2" onClick={() => logout()}>
            Create your own account
          </Link>
        </div>
      )}
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r bg-card p-5 md:flex">
          <Logo />
          <div className="flex-1">{nav}</div>
          {account}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
            <Logo />
            <button onClick={() => setOpen(!open)} className="rounded-lg p-2 hover:bg-muted" aria-label="Menu" aria-expanded={open}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          {open && <div className="space-y-4 border-b bg-card p-4 md:hidden">{nav}{account}</div>}
          <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
