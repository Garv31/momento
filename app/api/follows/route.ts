import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Notification from '@/lib/models/Notification';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    await connectDB();

    const currentUser = await User.findById(session.user.id);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isFollowing = currentUser?.following.some(
      (id: { toString: () => string }) => id.toString() === userId
    );

    if (isFollowing) {
      await User.findByIdAndUpdate(session.user.id, {
        $pull: { following: userId },
      });
      await User.findByIdAndUpdate(userId, {
        $pull: { followers: session.user.id },
      });
    } else {
      await User.findByIdAndUpdate(session.user.id, {
        $push: { following: userId },
      });
      await User.findByIdAndUpdate(userId, {
        $push: { followers: session.user.id },
      });
      await Notification.create({
        type: 'follow',
        sender: session.user.id,
        recipient: userId,
      });
    }

    return NextResponse.json({ following: !isFollowing });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
