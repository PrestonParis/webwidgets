import { automationErrorSchema } from '@/lib/automationContracts/errors';
import {
    calendarCreateInputSchema,
    calendarCreateOutputSchema,
    emailDraftInputSchema,
    emailDraftOutputSchema,
} from './capabilitySchemas';
import type { CapabilityRegistration } from './types';

export const providerCapabilities: readonly CapabilityRegistration[] = [
    {
        name: 'calendar.create_event',
        version: '1',
        definitionHash:
            '1d36c6e5c4aa1220a1063b941f7fd8a7a902bf536cbd60c31029df390a3b254b',
        owner: 'nextjs_provider_adapter',
        inputSchema: calendarCreateInputSchema,
        outputSchema: calendarCreateOutputSchema,
        errorSchema: automationErrorSchema,
        requiredIntegrations: ['google_calendar'],
        requiredScopes: { google_calendar: ['calendar:write'] },
        riskClass: 'external',
        reversibility: 'compensatable',
        idempotencyStrategy: 'canonical_action_request',
        executionPolicy: {
            timeoutSeconds: 60,
            maxAttempts: 3,
            concurrencyKey: 'connection',
        },
        estimateResources: () => ({
            providerCalls: 2,
            modelTokens: 0,
            costMicrounits: 0,
            activeSeconds: 5,
        }),
        binding: {
            executorId: 'nextjs.internal.execute_approved_calendar',
            verifierId: 'provider.readback.calendar',
            compensationId: 'nextjs.calendar.undo_create',
        },
        observability: {
            eventNamespace: 'automation.capability',
            recordInputHash: true,
            recordOutputHash: true,
            redactionPolicy: 'registry_fields',
        },
        redactedInputFields: ['description', 'attendees'],
        fixture: {
            id: 'calendar.create_event.v1',
            input: {
                provider: 'google',
                accountId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                calendarId: 'primary',
                title: 'Project review',
                description: null,
                location: null,
                attendees: [],
                allDay: false,
                startsAt: '2026-09-09T14:00:00.000Z',
                endsAt: '2026-09-09T14:30:00.000Z',
                timezone: 'America/New_York',
            },
            output: {
                state: 'verified',
                providerObjectId: 'wwfixture',
                htmlLink: 'https://calendar.google.com/event?eid=fixture',
                start: '2026-09-09T14:00:00.000Z',
                end: '2026-09-09T14:30:00.000Z',
                code: 'calendar_event_verified',
            },
            testReference:
                'tests/unit/calendar/calendarActionAdapter.test.ts; supabase/tests/012_calendar_workflow_actions.test.sql',
        },
    },
    {
        name: 'email.draft',
        version: '1',
        definitionHash:
            '41be79f62f241118b3ec37cb3757028de69465bc1c6a0a09513ec0d58cf8b659',
        owner: 'nextjs_provider_adapter',
        inputSchema: emailDraftInputSchema,
        outputSchema: emailDraftOutputSchema,
        errorSchema: automationErrorSchema,
        requiredIntegrations: ['google_mail', 'microsoft_mail'],
        requiredScopes: {
            google_mail: ['email:write'],
            microsoft_mail: ['email:write'],
        },
        riskClass: 'external',
        reversibility: 'none',
        idempotencyStrategy: 'canonical_action_request',
        executionPolicy: {
            timeoutSeconds: 60,
            maxAttempts: 3,
            concurrencyKey: 'connection',
        },
        estimateResources: () => ({
            providerCalls: 2,
            modelTokens: 0,
            costMicrounits: 0,
            activeSeconds: 5,
        }),
        binding: {
            executorId: 'nextjs.internal.execute_approved_email',
            verifierId: 'provider.readback.email',
        },
        observability: {
            eventNamespace: 'automation.capability',
            recordInputHash: true,
            recordOutputHash: true,
            redactionPolicy: 'registry_fields',
        },
        redactedInputFields: ['to', 'cc', 'bcc', 'subject', 'body', 'reply'],
        fixture: {
            id: 'email.draft.v1',
            input: {
                provider: 'google',
                accountId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                from: 'owner@example.com',
                to: ['recipient@example.com'],
                cc: [],
                bcc: [],
                subject: 'Project update',
                body: 'The project is on track.',
                reply: null,
            },
            output: {
                state: 'verified',
                providerObjectId: 'draft-fixture',
                providerMessageId: null,
                threadId: null,
                code: 'email_draft_verified',
            },
            testReference:
                'tests/unit/inbox/gmailActionAdapter.test.ts; tests/unit/inbox/outlookActionAdapter.test.ts; supabase/tests/011_email_dispatch_guard.test.sql',
        },
    },
];
