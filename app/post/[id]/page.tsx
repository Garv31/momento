'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import Sidebar from '@/components/Sidebar';
import { fetcher } from '@/lib/api';

interface Author {
  _id: string;
  username: string;
  name: string;
  image: string;
}

interface Comment {
  _id: string;
  text: string;
  author: Author;
  createdAt: string;
}

interface Post {
  _id: string;
  caption: string;
  images: string[];
  author: Author;
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

export default function PostPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchPost();
    }
  }, [session, id]);

  const fetchPost = async () => {
    try {
      const data = await fetcher(`/api/posts/${id}`);
      setPost(data.post);
      setLiked(data.post.likes.includes(session?.user?.id || ''));
      setLikesCount(data.post.likes.length);
    } catch {
      console.error('Failed to fetch post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const data = await fetcher('/api/likes', {
        method: 'POST',
        body: JSON.stringify({ postId: id }),
      });
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch {
      toast.error('Failed to like post');
    }
  };

  const handleSave = async () => {
    try {
      const data = await fetcher('/api/saves', {
        method: 'POST',
        body: JSON.stringify({ postId: id }),
      });
      setSaved(data.saved);
      toast.success(data.saved ? 'Post saved' : 'Post unsaved');
    } catch {
      toast.error('Failed to save post');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      const data = await fetcher('/api/comments', {
        method: 'POST',
        body: JSON.stringify({ postId: id, text: commentText }),
      });
      setPost((prev) =>
        prev ? { ...prev, comments: [...prev.comments, data.comment] } : null
      );
      setCommentText('');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await fetcher(`/api/comments?id=${commentId}`, { method: 'DELETE' });
      setPost((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.filter((c) => c._id !== commentId),
            }
          : null
      );
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 md:ml-[244px] p-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="w-full aspect-square md:aspect-[4/3]" />
          </div>
        </main>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-[244px] pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-background border border-border rounded-xl overflow-hidden"
          >
            <div className="md:flex">
              <div className="md:w-[60%] aspect-square md:aspect-auto bg-muted">
                <Image
                  src={post.images[0]}
                  alt="Post"
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="md:w-[40%] flex flex-col">
                <div className="p-4 border-b border-border">
                  <Link
                    href={`/profile/${post.author._id}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={post.author.image} />
                      <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">
                      {post.author.username}
                    </span>
                  </Link>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
                  {post.caption && (
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={post.author.image} />
                        <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm">
                          <span className="font-semibold mr-2">
                            {post.author.username}
                          </span>
                          {post.caption}
                        </p>
                      </div>
                    </div>
                  )}

                  {post.comments.map((comment) => (
                    <div key={comment._id} className="flex items-start gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={comment.author.image} />
                        <AvatarFallback>
                          {comment.author.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-semibold mr-2">
                            {comment.author.username}
                          </span>
                          {comment.text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {comment.author._id === session?.user?.id && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <button onClick={handleLike}>
                        <Heart
                          className={`w-6 h-6 transition-colors ${
                            liked ? 'fill-red-500 text-red-500' : ''
                          }`}
                        />
                      </button>
                      <button>
                        <MessageCircle className="w-6 h-6" />
                      </button>
                      <button>
                        <Send className="w-6 h-6" />
                      </button>
                    </div>
                    <button onClick={handleSave}>
                      <Bookmark
                        className={`w-6 h-6 ${saved ? 'fill-foreground' : ''}`}
                      />
                    </button>
                  </div>

                  <p className="font-semibold text-sm mb-2">
                    {likesCount} likes
                  </p>
                  <p className="text-xs text-muted-foreground uppercase mb-4">
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                    })}
                  </p>

                  <div className="flex items-center gap-2">
                    <Input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleComment()
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={handleComment}
                      disabled={!commentText.trim()}
                      size="sm"
                    >
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
