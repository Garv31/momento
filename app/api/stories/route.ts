import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Story from '@/lib/models/Story';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findById(session.user.id);
    const followingIds =
      currentUser?.following.map((id: { toString: () => string }) =>
        id.toString()
      ) || [];
    followingIds.push(session.user.id);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await Story.find({
      author: { $in: followingIds },
      createdAt: { $gte: twentyFourHoursAgo },
    })
      .sort({ createdAt: -1 })
      .populate('author', 'username name image');

    const groupedStories = stories.reduce(
      (acc: Record<string, { author: unknown; stories: unknown[] }>, story: unknown) => {
        const s = story as { author: { _id: { toString: () => string } } };
        const authorId = s.author._id.toString();
        if (!acc[authorId]) {
          acc[authorId] = {
            author: s.author,
            stories: [],
          };
        }
        acc[authorId].stories.push(story);
        return acc;
      },
      {}
    );

    return NextResponse.json({ stories: Object.values(groupedStories) });
  } catch (error) {
    console.error('Get stories error:', error);
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

    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const story = await Story.create({
      image,
      author: session.user.id,
    });

    const populatedStory = await Story.findById(story._id).populate(
      'author',
      'username name image'
    );

    return NextResponse.json({ story: populatedStory }, { status: 201 });
  } catch (error) {
    console.error('Create story error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
