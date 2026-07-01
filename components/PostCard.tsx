'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
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

interface PostCardProps {
  post: Post;
  onUpdate?: () => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(
    post.likes.includes(session?.user?.id || '')
  );
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [currentImage, setCurrentImage] = useState(0);
  const [showLiked, setShowLiked] = useState(false);

  const isAuthor = post.author._id === session?.user?.id;

  const handleLike = async () => {
    try {
      const data = await fetcher('/api/likes', {
        method: 'POST',
        body: JSON.stringify({ postId: post._id }),
      });
      setLiked(data.liked);
      setLikesCount(data.likesCount);
      if (data.liked) setShowLiked(true);
      setTimeout(() => setShowLiked(false), 1000);
    } catch {
      toast.error('Failed to like post');
    }
  };

  const handleSave = async () => {
    try {
      const data = await fetcher('/api/saves', {
        method: 'POST',
        body: JSON.stringify({ postId: post._id }),
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
        body: JSON.stringify({ postId: post._id, text: commentText }),
      });
      setComments([...comments, data.comment]);
      setCommentText('');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await fetcher(`/api/comments?id=${commentId}`, { method: 'DELETE' });
      setComments(comments.filter((c) => c._id !== commentId));
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleDeletePost = async () => {
    try {
      await fetcher(`/api/posts/${post._id}`, { method: 'DELETE' });
      toast.success('Post deleted');
      onUpdate?.();
    } catch {
      toast.error('Failed to delete post');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background border border-border rounded-xl overflow-hidden mb-6"
    >
      <div className="flex items-center justify-between p-4">
        <Link
          href={`/profile/${post.author._id}`}
          className="flex items-center gap-3"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={post.author.image} />
            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{post.author.username}</p>
            <p className="text-xs text-muted-foreground">{post.author.name}</p>
          </div>
        </Link>

        {isAuthor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDeletePost}
                className="text-red-500"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="relative aspect-square bg-muted">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <Image
              src={post.images[currentImage]}
              alt="Post image"
              fill
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {showLiked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Heart className="w-24 h-24 text-white fill-red-500 drop-shadow-lg" />
          </motion.div>
        )}

        {post.images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {post.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentImage ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button onClick={handleLike}>
              <Heart
                className={`w-6 h-6 transition-colors ${
                  liked ? 'fill-red-500 text-red-500' : ''
                }`}
              />
            </button>
            <button onClick={() => setShowComments(true)}>
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

        <p className="font-semibold text-sm mb-1">{likesCount} likes</p>

        <div className="mb-2">
          <span className="font-semibold text-sm mr-2">
            {post.author.username}
          </span>
          <span className="text-sm">{post.caption}</span>
        </div>

        {comments.length > 0 && (
          <button
            onClick={() => setShowComments(true)}
            className="text-sm text-muted-foreground mb-2"
          >
            View all {comments.length} comments
          </button>
        )}

        <p className="text-xs text-muted-foreground uppercase">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </p>
      </div>

      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {comments.map((comment) => (
              <div key={comment._id} className="flex items-start gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={comment.author.image} />
                  <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
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

          <div className="flex items-center gap-2 pt-4 border-t">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            />
            <Button
              onClick={handleComment}
              disabled={!commentText.trim()}
              size="sm"
            >
              Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
