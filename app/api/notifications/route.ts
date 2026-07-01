import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Notification from '@/lib/models/Notification';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const notifications = await Notification.find({
      recipient: session.user.id,
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'username name image')
      .populate('post', 'images')
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: session.user.id,
      read: false,
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    await Notification.updateMany(
      { recipient: session.user.id, read: false },
      { read: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
