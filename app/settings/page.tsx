'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import { fetcher } from '@/lib/api';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const data = await fetcher(`/api/users/${session?.user?.id}`);
      setName(data.user.name || '');
      setBio(data.user.bio || '');
      setImage(data.user.image || '');
    } catch {
      console.error('Failed to fetch profile');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setImage(data.url);
      toast.success('Image uploaded');
    } catch {
      toast.error('Failed to upload image');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetcher(`/api/users/${session?.user?.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, bio, image }),
      });
      toast.success('Profile updated!');
      router.push(`/profile/${session?.user?.id}`);
    } catch {
      toast.error('Failed to update profile');
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
        <div className="max-w-[630px] mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-xl font-bold mb-6">Edit Profile</h1>

            <div className="flex items-center gap-4 mb-8">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={image} />
                  <AvatarFallback className="text-2xl">
                    {name[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <p className="font-semibold">{session.user.username}</p>
                <p className="text-sm text-muted-foreground">
                  Change profile photo
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
