'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, UserPlus, UserCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Sidebar from '@/components/Sidebar';
import { toast } from 'sonner';
import { fetcher } from '@/lib/api';

interface User {
  _id: string;
  username: string;
  name: string;
  image: string;
  followers: string[];
  isFollowing?: boolean;
}

export default function SearchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchSuggestions();
    }
  }, [session]);

  const fetchSuggestions = async () => {
    try {
      const data = await fetcher('/api/users');
      setSuggestions(data.users);
    } catch {
      console.error('Failed to fetch suggestions');
    }
  };

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetcher(
        `/api/users?q=${encodeURIComponent(searchQuery)}`
      );
      setUsers(data.users);
    } catch {
      console.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchUsers(query);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, searchUsers]);

  const handleFollow = async (userId: string) => {
    try {
      const data = await fetcher('/api/follows', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isFollowing: data.following } : u
        )
      );
      setSuggestions((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isFollowing: data.following } : u
        )
      );
      toast.success(data.following ? 'Following' : 'Unfollowed');
    } catch {
      toast.error('Failed to follow user');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  if (!session) return null;

  const displayUsers = query.trim() ? users : suggestions;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-[244px] pb-20 md:pb-0">
        <div className="max-w-[630px] mx-auto px-4 py-6">
          <h1 className="text-xl font-bold mb-6">Search</h1>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-24 h-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {displayUsers.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Search className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {query.trim()
                      ? 'No users found'
                      : 'Search for users to follow'}
                  </p>
                </motion.div>
              )}

              {displayUsers.map((u) => (
                <motion.div
                  key={u._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Link
                    href={`/profile/${u._id}`}
                    className="flex items-center gap-3 flex-1"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={u.image} />
                      <AvatarFallback>{u.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{u.username}</p>
                      <p className="text-sm text-muted-foreground">{u.name}</p>
                      {u.followers && (
                        <p className="text-xs text-muted-foreground">
                          {u.followers.length} followers
                        </p>
                      )}
                    </div>
                  </Link>

                  {u._id !== session.user.id && (
                    <Button
                      onClick={() => handleFollow(u._id)}
                      variant={u.isFollowing ? 'outline' : 'default'}
                      size="sm"
                    >
                      {u.isFollowing ? (
                        <UserCheck className="w-4 h-4 mr-1" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-1" />
                      )}
                      {u.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
