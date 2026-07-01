import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Post from '@/lib/models/Post';
import Notification from '@/lib/models/Notification';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await req.json();

    await connectDB();

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const hasLiked = post.likes.some(
      (id: { toString: () => string }) => id.toString() === session.user.id
    );

    if (hasLiked) {
      post.likes = post.likes.filter(
        (id: { toString: () => string }) => id.toString() !== session.user.id
      );
    } else {
      post.likes.push(session.user.id);
      if (post.author.toString() !== session.user.id) {
        await Notification.create({
          type: 'like',
          sender: session.user.id,
          recipient: post.author,
          post: postId,
        });
      }
    }

    await post.save();

    return NextResponse.json({
      liked: !hasLiked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
