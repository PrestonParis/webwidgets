import { NextResponse } from 'next/server';
import superjson from 'superjson';
import { getLogger } from '@/lib/observability/logger';

const emptyFeed = {
    items: [],
    timelines: [],
    generatedAt: '',
    sourceCount: 0,
};

export async function GET() {
    const log = getLogger({ route: '/api/news/feed' });
    log.info({ itemCount: 0, sourceCount: 0 }, 'news feed served (no sources connected)');
    const feed = { ...emptyFeed, generatedAt: new Date().toISOString() };
    return NextResponse.json(superjson.serialize(feed));
}
