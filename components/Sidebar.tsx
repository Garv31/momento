'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Search,
  Compass,
  Heart,
  PlusSquare,
  User,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  Bookmark,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Compass, label: 'Explore', href: '/explore' },
  { icon: Heart, label: 'Notifications', href: '/notifications' },
  { icon: PlusSquare, label: 'Create', href: '/create' },
  { icon: Bookmark, label: 'Saved', href: '/saved' },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[244px] border-r border-border flex-col bg-background z-50">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Momento</h1>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-colors ${
                  isActive ? 'font-semibold bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <Link
            href={`/profile/${session?.user?.id}`}
            className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-colors ${
              pathname?.startsWith('/profile')
                ? 'font-semibold bg-accent'
                : 'hover:bg-accent/50'
            }`}
          >
            <Avatar className="w-6 h-6">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="text-xs">
                {session?.user?.name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <span>Profile</span>
          </Link>
        </nav>

        <div className="p-3 space-y-1">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-accent/50 w-full transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-6 h-6" />
            ) : (
              <Moon className="w-6 h-6" />
            )}
            <span>Theme</span>
          </button>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-accent/50 w-full transition-colors text-red-500"
          >
            <LogOut className="w-6 h-6" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-background border-t border-border flex items-center justify-around z-50">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`p-2 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              <Icon className="w-6 h-6" />
            </Link>
          );
        })}

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-muted-foreground"
        >
          <Menu className="w-6 h-6" />
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/50 z-50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed right-0 top-0 bottom-0 w-[280px] bg-background z-50 p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold">Menu</h2>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-2">
                <Link
                  href={`/profile/${session?.user?.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-accent/50"
                >
                  <User className="w-6 h-6" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/saved"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-accent/50"
                >
                  <Bookmark className="w-6 h-6" />
                  <span>Saved</span>
                </Link>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-accent/50 w-full"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-6 h-6" />
                  ) : (
                    <Moon className="w-6 h-6" />
                  )}
                  <span>Theme</span>
                </button>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-accent/50 w-full text-red-500"
                >
                  <LogOut className="w-6 h-6" />
                  <span>Log out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
