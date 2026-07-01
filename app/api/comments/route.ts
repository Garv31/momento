import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Comment from '@/lib/models/Comment';
import Post from '@/lib/models/Post';
import Notification from '@/lib/models/Notification';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, text } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const comment = await Comment.create({
      text,
      author: session.user.id,
      post: postId,
    });

    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment._id },
    });

    const post = await Post.findById(postId);
    if (post && post.author.toString() !== session.user.id) {
      await Notification.create({
        type: 'comment',
        sender: session.user.id,
        recipient: post.author,
        post: postId,
      });
    }

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'username name image'
    );

    return NextResponse.json(
      { comment: populatedComment },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const comment = await Comment.findOneAndDelete({
      _id: commentId,
      author: session.user.id,
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
