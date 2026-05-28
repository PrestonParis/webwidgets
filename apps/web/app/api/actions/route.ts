import { NextResponse } from 'next/server';
import superjson from 'superjson';
import {
    listActionMetadata,
    searchActionMetadata,
} from '@/features/actions/lib/actionRegistry';

export function GET(request: Request) {
    const query = new URL(request.url).searchParams.get('query') ?? '';
    const actions = query.trim()
        ? searchActionMetadata(query)
        : listActionMetadata();
    return NextResponse.json(superjson.serialize(actions));
}
