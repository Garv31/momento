'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import StoryBar from '@/components/StoryBar';
import PostCard from '@/components/PostCard';
import CreatePostModal from '@/components/CreatePostModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { fetcher } from '@/lib/api';

interface PostAuthor {
  _id: string;
  username: string;
  name: string;
  image: string;
}

interface Comment {
  _id: string;
  text: string;
  author: PostAuthor;
  createdAt: string;
}

interface Post {
  _id: string;
  caption: string;
  images: string[];
  author: PostAuthor;
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchPosts = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      const data = await fetcher(`/api/posts?page=${pageNum}&limit=10`);
      if (pageNum === 1) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }
      setHasMore(data.hasMore);
    } catch {
      console.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchPosts(1);
    }
  }, [session, fetchPosts]);

  const loadMore = () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
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
        <div className="max-w-[630px] mx-auto px-4">
          <StoryBar />

          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onUpdate={() => fetchPosts(1)}
              />
            ))}

            {loading && (
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-background border border-border rounded-xl overflow-hidden"
                  >
                    <div className="p-4 flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="w-32 h-4" />
                    </div>
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="w-20 h-4" />
                      <Skeleton className="w-full h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && posts.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <Camera className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Welcome to Momento
                </h3>
                <p className="text-muted-foreground mb-6">
                  Follow people to see their posts in your feed
                </p>
                <Button onClick={() => setShowCreate(true)}>
                  Create your first post
                </Button>
              </motion.div>
            )}

            {hasMore && posts.length > 0 && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <CreatePostModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => fetchPosts(1)}
      />
    </div>
  );
}
