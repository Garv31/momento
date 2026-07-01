import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Post from '@/lib/models/Post';
import Comment from '@/lib/models/Comment';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const post = await Post.findById(params.id)
      .populate('author', 'username name image')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username name image' },
      });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caption } = await req.json();

    await connectDB();

    const post = await Post.findOneAndUpdate(
      { _id: params.id, author: session.user.id },
      { caption },
      { new: true }
    )
      .populate('author', 'username name image')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username name image' },
      });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const post = await Post.findOneAndDelete({
      _id: params.id,
      author: session.user.id,
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    await Comment.deleteMany({ post: params.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
