import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Post from '@/lib/models/Post';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await req.json();

    await connectDB();

    const user = await User.findById(session.user.id);
    const isSaved = user?.savedPosts.some(
      (id: { toString: () => string }) => id.toString() === postId
    );

    if (isSaved) {
      await User.findByIdAndUpdate(session.user.id, {
        $pull: { savedPosts: postId },
      });
    } else {
      await User.findByIdAndUpdate(session.user.id, {
        $push: { savedPosts: postId },
      });
    }

    return NextResponse.json({ saved: !isSaved });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).populate({
      path: 'savedPosts',
      populate: { path: 'author', select: 'username name image' },
    });

    return NextResponse.json({ posts: user?.savedPosts || [] });
  } catch (error) {
    console.error('Get saved posts error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
