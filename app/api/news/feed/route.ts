import { NextResponse } from 'next/server';
import superjson from 'superjson';
import { getDemoNewsFeed } from '@/features/news/services/newsData';
import { getLogger } from '@/lib/observability/logger';

export async function GET() {
    const log = getLogger({ route: '/api/news/feed' });
    const feed = getDemoNewsFeed();
    log.info(
        { itemCount: feed.items.length, sourceCount: feed.sourceCount },
        'news feed served',
    );
    return NextResponse.json(superjson.serialize(feed));
}
