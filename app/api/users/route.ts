import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    await connectDB();

    if (query) {
      const users = await User.find({
        $and: [
          {
            $or: [
              { username: { $regex: query, $options: 'i' } },
              { name: { $regex: query, $options: 'i' } },
            ],
          },
          { _id: { $ne: session.user.id } },
        ],
      })
        .select('username name image followers following')
        .limit(20);

      return NextResponse.json({ users });
    }

    const currentUser = await User.findById(session.user.id);
    const followingIds =
      currentUser?.following.map((id: { toString: () => string }) =>
        id.toString()
      ) || [];

    const suggestions = await User.find({
      _id: { $nin: [...followingIds, session.user.id] },
    })
      .select('username name image followers')
      .limit(5);

    return NextResponse.json({ users: suggestions });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
