import { describe, expect, it } from 'vitest';

import { loadConfig } from '../../../tools/claude-dispatcher/config';
import { buildClaudePrompt } from '../../../tools/claude-dispatcher/prompt';
import {
    ineligibleReason,
    selectEligibleIssues,
} from '../../../tools/claude-dispatcher/selection';
import type { DispatchIssue } from '../../../tools/claude-dispatcher/types';
import { issueBranch } from '../../../tools/claude-dispatcher/worktree';

function issue(overrides: Partial<DispatchIssue> = {}): DispatchIssue {
    return {
        number: 20,
        title: 'Repair the queue',
        body: 'Priority: P1\nState: approved',
        url: 'https://github.com/PrestonParis/aidash/issues/20',
        createdAt: '2026-08-12T00:00:00Z',
        labels: [],
        assignees: [],
        ...overrides,
    };
}

const config = loadConfig('/repo', {});

describe('dispatcher selection', () => {
    it('orders eligible issues by priority and creation time', () => {
        const issues = [
            issue({ number: 21, body: 'Priority: P2\nState: approved' }),
            issue({ number: 22, body: 'Priority: P0\nState: approved' }),
        ];
        expect(
            selectEligibleIssues(issues, config).map((item) => item.number),
        ).toEqual([22, 21]);
    });

    it('rejects blocked, assigned, claimed, and unapproved issues', () => {
        expect(ineligibleReason(issue({ body: 'Priority: P0' }), config)).toBe(
            'not approved',
        );
        expect(
            ineligibleReason(
                issue({ labels: [{ name: 'state:blocked' }] }),
                config,
            ),
        ).toContain('blocked');
        expect(
            ineligibleReason(
                issue({ labels: [{ name: 'state:claimed' }] }),
                config,
            ),
        ).toBe('already claimed');
        expect(
            ineligibleReason(
                issue({ assignees: [{ login: 'worker' }] }),
                config,
            ),
        ).toBe('already assigned');
    });

    it('builds an issue branch and constrained Claude prompt', () => {
        const target = issue();
        expect(issueBranch(target)).toBe('agent/claude/20-repair-the-queue');
        const prompt = buildClaudePrompt(target);
        expect(prompt).toContain('GitHub issue #20');
        expect(prompt).toContain('Never merge or deploy');
        expect(prompt).toContain('AGENTS.md');
    });
});
