'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Ticket,
  ListTodo,
  PlusCircle,
  Monitor,
  Laptop,
  KeyRound,
  Users,
  FolderTree,
  Settings,
  ClipboardList,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import type { UserItem } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Notification {
  _id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

interface UserContextValue {
  user: UserItem | null;
  notifications: Notification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  Context + hooks                                                   */
/* ------------------------------------------------------------------ */

const UserContext = createContext<UserContextValue>({
  user: null,
  notifications: [],
  unreadCount: 0,
  refreshNotifications: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export function useAuth() {
  const { user } = useUser();
  return {
    user,
    isAdmin: user?.role === 'admin',
    isAgent: user?.role === 'agent' || user?.role === 'admin',
    isRequester: user?.role === 'requester',
  };
}

/* ------------------------------------------------------------------ */
/*  Navigation config                                                 */
/* ------------------------------------------------------------------ */

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles?: string[]; // undefined = all roles
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'TICKETING',
    items: [
      {
        label: 'My Tickets',
        href: '/tickets/mine',
        icon: <Ticket className="h-5 w-5" />,
        roles: ['requester'],
      },
      {
        label: 'All Tickets',
        href: '/tickets',
        icon: <ListTodo className="h-5 w-5" />,
        roles: ['agent', 'admin'],
      },
      {
        label: 'New Ticket',
        href: '/tickets/new',
        icon: <PlusCircle className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'ASSET MANAGEMENT',
    items: [
      {
        label: 'My Devices',
        href: '/my-devices',
        icon: <Laptop className="h-5 w-5" />,
        roles: ['requester'],
      },
      {
        label: 'Devices',
        href: '/devices',
        icon: <Monitor className="h-5 w-5" />,
        roles: ['agent', 'admin'],
      },
      {
        label: 'Licenses',
        href: '/licenses',
        icon: <KeyRound className="h-5 w-5" />,
        roles: ['agent', 'admin'],
      },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      {
        label: 'Users',
        href: '/admin/users',
        icon: <Users className="h-5 w-5" />,
        roles: ['admin'],
      },
      {
        label: 'Categories',
        href: '/admin/categories',
        icon: <FolderTree className="h-5 w-5" />,
        roles: ['admin'],
      },
      {
        label: 'Settings',
        href: '/admin/settings',
        icon: <Settings className="h-5 w-5" />,
        roles: ['admin'],
      },
      {
        label: 'Audit Log',
        href: '/admin/audit',
        icon: <ClipboardList className="h-5 w-5" />,
        roles: ['admin'],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  AppShell                                                          */
/* ------------------------------------------------------------------ */

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  /* Fetch current user */
  useEffect(() => {
    fetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) throw new Error('unauthorized');
        const data = await res.json();
        setUser(data.user ?? data);
      })
      .catch(() => {
        router.replace('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  /* Fetch notifications */
  const refreshNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 30_000);
    return () => clearInterval(interval);
  }, [user, refreshNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  /* Logout */
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  /* Filter nav items by role */
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || (user && item.roles.includes(user.role))
      ),
    }))
    .filter((section) => section.items.length > 0);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <UserContext.Provider value={{ user, notifications, unreadCount, refreshNotifications }}>
      <div className="flex h-screen bg-gray-50">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Monitor className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">IT-Support</span>
            </Link>
            <button
              className="rounded-md p-1 text-gray-400 hover:text-gray-600 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {visibleSections.map((section, si) => (
              <div key={si} className={cn(si > 0 && 'mt-6')}>
                {section.title && (
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {section.title}
                  </p>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            active
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          )}
                        >
                          <span className={active ? 'text-blue-600' : 'text-gray-400'}>
                            {item.icon}
                          </span>
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
            <button
              className="rounded-md p-2 text-gray-400 hover:text-gray-600 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              {/* Notification bell */}
              <div className="relative">
                <button
                  className="relative rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setNotifMenuOpen(!notifMenuOpen);
                    setUserMenuOpen(false);
                  }}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                {notifMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-[calc(100vw-2rem)] max-w-80 rounded-lg border border-gray-200 bg-white shadow-lg sm:w-80">
                    <div className="border-b border-gray-200 px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">Notifications</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-gray-500">
                          No notifications
                        </p>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n._id}
                            className={cn(
                              'border-b border-gray-100 px-4 py-3 text-sm last:border-0',
                              !n.isRead && 'bg-blue-50'
                            )}
                          >
                            <p className="text-gray-700">{n.message}</p>
                            <p className="mt-1 text-xs text-gray-400">
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setNotifMenuOpen(false);
                  }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
                    <div className="border-b border-gray-200 px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>

        {/* Close menus on outside click */}
        {(userMenuOpen || notifMenuOpen) && (
          <div
            className="fixed inset-0 z-30"
            onClick={() => {
              setUserMenuOpen(false);
              setNotifMenuOpen(false);
            }}
          />
        )}
      </div>
    </UserContext.Provider>
  );
}
