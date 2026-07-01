'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Grid3X3,
  Bookmark,
  Settings,
  UserPlus,
  UserCheck,
  Camera,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Sidebar from '@/components/Sidebar';
import { toast } from 'sonner';
import { fetcher } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UserRef {
  _id: string;
  username: string;
  name: string;
  image: string;
}

interface UserProfile {
  _id: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  followers: UserRef[];
  following: UserRef[];
}

interface Post {
  _id: string;
  images: string[];
  likes: string[];
  comments: unknown[];
}

export default function ProfilePage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const isOwnProfile = session?.user?.id === id;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchProfile();
      fetchPosts();
    }
  }, [id, session]);

  const fetchProfile = async () => {
    try {
      const data = await fetcher(`/api/users/${id}`);
      setProfile(data.user);
    } catch {
      console.error('Failed to fetch profile');
    }
  };

  const fetchPosts = async () => {
    try {
      const data = await fetcher(`/api/posts?userId=${id}&limit=50`);
      setPosts(data.posts);
    } catch {
      console.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const data = await fetcher('/api/follows', {
        method: 'POST',
        body: JSON.stringify({ userId: id }),
      });
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: data.following,
              followersCount: data.following
                ? prev.followersCount + 1
                : prev.followersCount - 1,
            }
          : null
      );
      toast.success(data.following ? 'Following' : 'Unfollowed');
    } catch {
      toast.error('Failed to follow user');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 md:ml-[244px] p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-8 mb-8">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="w-48 h-6" />
                <Skeleton className="w-32 h-4" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-[244px] pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
            <Avatar className="w-24 h-24 md:w-36 md:h-36">
              <AvatarImage src={profile.image} />
              <AvatarFallback className="text-3xl">
                {profile.name[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                <h1 className="text-xl font-semibold">{profile.username}</h1>
                {isOwnProfile ? (
                  <Link href="/settings">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                ) : (
                  <Button
                    onClick={handleFollow}
                    variant={profile.isFollowing ? 'outline' : 'default'}
                    size="sm"
                  >
                    {profile.isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-center md:justify-start gap-6 mb-4">
                <span>
                  <strong>{posts.length}</strong> posts
                </span>
                <button onClick={() => setShowFollowers(true)}>
                  <strong>{profile.followersCount}</strong> followers
                </button>
                <button onClick={() => setShowFollowing(true)}>
                  <strong>{profile.followingCount}</strong> following
                </button>
              </div>

              <div>
                <p className="font-semibold">{profile.name}</p>
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border">
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex items-center gap-2 py-4 text-sm uppercase tracking-wider ${
                  activeTab === 'posts'
                    ? 'border-t-2 border-foreground font-semibold'
                    : 'text-muted-foreground'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Posts
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`flex items-center gap-2 py-4 text-sm uppercase tracking-wider ${
                    activeTab === 'saved'
                      ? 'border-t-2 border-foreground font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  Saved
                </button>
              )}
            </div>
          </div>

          {activeTab === 'posts' && (
            <div className="grid grid-cols-3 gap-1 md:gap-4 mt-4">
              {posts.map((post) => (
                <Link
                  href={`/post/${post._id}`}
                  key={post._id}
                  className="relative aspect-square group"
                >
                  <Image
                    src={post.images[0]}
                    alt="Post"
                    fill
                    className="object-cover"
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
          )}

          {activeTab === 'posts' && posts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Camera className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                {isOwnProfile
                  ? 'Share your first moment with the world'
                  : 'This user has not posted anything yet'}
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {profile.followers.map((u) => (
              <Link
                key={u._id}
                href={`/profile/${u._id}`}
                onClick={() => setShowFollowers(false)}
                className="flex items-center gap-3"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={u.image} />
                  <AvatarFallback>{u.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{u.username}</p>
                  <p className="text-xs text-muted-foreground">{u.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {profile.following.map((u) => (
              <Link
                key={u._id}
                href={`/profile/${u._id}`}
                onClick={() => setShowFollowing(false)}
                className="flex items-center gap-3"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={u.image} />
                  <AvatarFallback>{u.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{u.username}</p>
                  <p className="text-xs text-muted-foreground">{u.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
