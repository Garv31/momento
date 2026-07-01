import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(params.id)
      .select('username name bio image followers following')
      .populate('followers', 'username name image')
      .populate('following', 'username name image');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isFollowing = user.followers.some(
      (f: { _id: { toString: () => string } }) =>
        f._id.toString() === session.user.id
    );

    return NextResponse.json({
      user: {
        ...user.toObject(),
        _id: user._id.toString(),
        isFollowing,
        followersCount: user.followers.length,
        followingCount: user.following.length,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
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
    if (!session?.user?.id || session.user.id !== params.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, bio, image } = await req.json();

    await connectDB();

    const user = await User.findByIdAndUpdate(
      params.id,
      { name, bio, image },
      { new: true }
    ).select('username name bio image followers following');

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
