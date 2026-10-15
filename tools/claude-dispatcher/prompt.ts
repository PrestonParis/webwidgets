import type { DispatchIssue } from './types';

export function buildClaudePrompt(issue: DispatchIssue): string {
    return `Work on GitHub issue #${issue.number} in PrestonParis/aidash.

Issue URL: ${issue.url}
Title: ${issue.title}

${issue.body}

Execution requirements:
- Read /AGENTS.md, /ARCHITECTURE.md, /ROADMAP.md, and /DEFINITION_OF_DONE.md first.
- Work only in the prepared issue worktree and current issue branch.
- Preserve unrelated changes and stay within the issue scope.
- Search before creating new utilities or abstractions.
- Run the targeted validation required by the issue and DEFINITION_OF_DONE.md.
- Do not run npm run build locally.
- Never merge or deploy.
- Commit the completed work with a message referencing #${issue.number}.
- Push the branch and open a draft PR that closes #${issue.number}.
- If blocked by a product, architecture, security, schema, RLS, or secrets decision, stop and comment the exact blocker on the issue instead of guessing.

At completion, report the commit SHA, draft PR URL, files changed, validation performed, and remaining review needs.`;
}
