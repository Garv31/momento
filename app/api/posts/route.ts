import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Post from '@/lib/models/Post';
import User from '@/lib/models/User';
import '@/lib/models/Comment';
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const userId = searchParams.get('userId');

    let query: Record<string, unknown> = {};
    if (userId) {
      query.author = userId;
    } else {
      const currentUser = await User.findById(session.user.id);
      const followingIds =
        currentUser?.following.map((id: { toString: () => string }) =>
          id.toString()
        ) || [];
      followingIds.push(session.user.id);
      query.author = { $in: followingIds };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name image')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username name image' },
      });

    const total = await Post.countDocuments(query);

    return NextResponse.json({
      posts,
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caption, images } = await req.json();

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'Images are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const post = await Post.create({
      caption,
      images,
      author: session.user.id,
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username name image')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username name image' },
      });

    return NextResponse.json({ post: populatedPost }, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
