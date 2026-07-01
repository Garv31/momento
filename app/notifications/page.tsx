'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, UserPlus, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import Sidebar from '@/components/Sidebar';
import { fetcher } from '@/lib/api';

interface NotificationSender {
  _id: string;
  username: string;
  name: string;
  image: string;
}

interface NotificationPost {
  _id: string;
  images: string[];
}

interface Notification {
  _id: string;
  type: 'like' | 'comment' | 'follow';
  sender: NotificationSender;
  post?: NotificationPost;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchNotifications();
    }
  }, [session]);

  const fetchNotifications = async () => {
    try {
      const data = await fetcher('/api/notifications');
      setNotifications(data.notifications);
      await fetcher('/api/notifications', { method: 'PATCH' });
    } catch {
      console.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getMessage = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      default:
        return 'interacted with you';
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
          <h1 className="text-xl font-bold mb-6">Notifications</h1>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="w-full h-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </motion.div>
              )}

              {notifications.map((notification) => (
                <Link
                  key={notification._id}
                  href={
                    notification.type === 'follow'
                      ? `/profile/${notification.sender._id}`
                      : `/post/${notification.post?._id || ''}`
                  }
                  className={`flex items-center gap-4 p-4 rounded-lg hover:bg-accent/50 transition-colors ${
                    !notification.read ? 'bg-accent/30' : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={notification.sender.image} />
                      <AvatarFallback>
                        {notification.sender.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                      {getIcon(notification.type)}
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">
                        {notification.sender.username}
                      </span>{' '}
                      {getMessage(notification)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {notification.post && (
                    <img
                      src={notification.post.images[0]}
                      alt=""
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
