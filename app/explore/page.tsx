'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Sidebar from '@/components/Sidebar';
import { fetcher } from '@/lib/api';

interface Post {
  _id: string;
  images: string[];
  likes: string[];
  comments: unknown[];
  author: {
    _id: string;
    username: string;
  };
}

export default function ExplorePage() {
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
      fetchExplorePosts();
    }
  }, [session]);

  const fetchExplorePosts = async () => {
    try {
      const data = await fetcher('/api/posts?limit=50');
      setPosts(data.posts);
    } catch {
      console.error('Failed to fetch explore posts');
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
        <div className="max-w-[975px] mx-auto px-4 py-6">
          <h1 className="text-xl font-bold mb-6">Explore</h1>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4">
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
                  <Compass className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No posts to explore yet
                  </p>
                </motion.div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4">
                {posts.map((post, i) => (
                  <Link
                    key={post._id}
                    href={`/post/${post._id}`}
                    className={`relative aspect-square group ${
                      i % 10 === 2 ? 'md:col-span-2 md:row-span-2' : ''
                    }`}
                  >
                    <img
                      src={post.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-5 h-5 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        {post.likes.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-5 h-5 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {post.comments.length}
                      </span>
                    </div>
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
