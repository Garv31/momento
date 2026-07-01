'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Sidebar from '@/components/Sidebar';
import { fetcher } from '@/lib/api';

interface Post {
  _id: string;
  images: string[];
  author: {
    _id: string;
    username: string;
  };
}

export default function SavedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchSavedPosts();
    }
  }, [session]);

  const fetchSavedPosts = async () => {
    try {
      const data = await fetcher('/api/saves');
      setPosts(data.posts);
    } catch {
      console.error('Failed to fetch saved posts');
    } finally {
      setLoading(false);
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-[244px] pb-20 md:pb-0">
        <div className="max-w-[630px] mx-auto px-4 py-6">
          <h1 className="text-xl font-bold mb-6">Saved Posts</h1>

          {loading ? (
            <div className="grid grid-cols-3 gap-1 md:gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : (
            <>
              {posts.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Save posts to see them here
                  </p>
                </motion.div>
              )}

              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {posts.map((post) => (
                  <Link
                    key={post._id}
                    href={`/post/${post._id}`}
                    className="relative aspect-square group"
                  >
                    <img
                      src={post.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
