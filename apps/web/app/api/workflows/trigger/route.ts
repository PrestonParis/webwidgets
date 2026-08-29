import { NextResponse } from 'next/server';
export function POST(): Response {
    return NextResponse.json(
        {
            error: {
                code: 'CANONICAL_APPROVAL_REQUIRED',
                message:
                    'Review and approve this workflow in Automation before it can run.',
                reviewPath: '/automation/workflows',
            },
        },
        { status: 409 },
    );
}
