# CLI Reference

## vercel — Deploy & manage Vercel projects

```sh
vercel                             # Deploy to preview URL
vercel --prod                      # Deploy to production
vercel dev                         # Local dev with Vercel edge functions + env vars
vercel env pull                    # Sync .env.local from Vercel dashboard (use after adding env vars online)
vercel logs <url>                  # Tail live logs for a deployment URL
vercel ls                          # List recent deployments
vercel rollback                    # Roll back production to the previous deployment
vercel link                        # Link this directory to a Vercel project
```

---

## stripe — Test webhooks & inspect Stripe events

```sh
stripe login                                                          # Authenticate with your Stripe account
stripe listen --forward-to localhost:3000/api/webhooks/stripe         # Forward live Stripe webhooks to local server
stripe trigger payment_intent.succeeded                               # Fire a test event to your local listener
stripe trigger checkout.session.completed                             # Simulate a completed checkout
stripe logs tail                                                      # Stream recent API call logs
stripe customers list                                                 # List customers in test mode
stripe --live listen --forward-to ...                                 # Use --live flag for production events (careful)
```

---

## zoxide — Smart directory jumping (replaces `cd`)

Learns which directories you visit most. Requires `eval "$(zoxide init zsh)"` in `.zshrc` (already set).

```sh
z dashboard            # Jump to the most-frecent directory matching "dashboard"
z proj dash            # Multi-token match — jumps to best match for both tokens
zi                     # Interactive picker using fzf — browse all tracked dirs
z -                    # Go back to the previous directory
zoxide query --list    # Show all tracked directories and their scores
zoxide add .           # Manually add current directory to the database
```

---

## bat — Syntax-highlighted `cat`

```sh
bat file.ts                        # View file with syntax highlighting and line numbers
bat -n file.ts                     # Line numbers only, no other decorations
bat --diff file.ts                 # Highlight diff output
bat --list-themes                  # Show all available color themes
bat --theme=TwoDark file.ts        # Use a specific theme
bat -l json response.txt           # Force a language (useful for files without extensions)
bat *.sql                          # View multiple files in sequence
```

---

## eza — Better `ls`

```sh
eza -la                            # Long list including hidden files
eza -la --git                      # Show git status (M, A, ?) next to each file
eza --tree                         # Recursive tree view of current directory
eza --tree --level=2               # Tree limited to 2 levels deep
eza -la --sort=size                # Sort by file size, largest first
eza -la --sort=modified            # Sort by last modified time
```

---

## gh — GitHub CLI

```sh
gh auth login                      # Authenticate (one-time setup)
gh pr create                       # Open interactive PR creation flow
gh pr list                         # List open PRs in the current repo
gh pr checkout 42                  # Check out PR #42 locally
gh pr view 42 --web                # Open PR #42 in the browser
gh issue create                    # Create a new issue interactively
gh issue list                      # List open issues
gh run list                        # List recent CI workflow runs
gh run watch                       # Watch the currently running workflow in real time
gh run view --log-failed           # Show logs only for failed steps
gh repo clone owner/repo           # Clone a repo by name
gh gist create file.ts             # Create a Gist from a local file
```

---

## starship — Shell prompt

Config lives at `~/.config/starship.toml`. Initialized via `eval "$(starship init zsh)"` in `.zshrc` (already set).

```sh
starship config                    # Open starship.toml in $EDITOR
starship explain                   # Print what each segment in the current prompt means
starship preset nerd-font-symbols  # Apply a preset theme
starship preset -l                 # List all available presets
```

---

## fzf — Fuzzy finder

Key bindings active after `source ~/.fzf.zsh` in `.zshrc` (already set).

```sh
# In the terminal:
Ctrl+R                             # Fuzzy search through command history
Ctrl+T                             # Fuzzy find files and paste path at cursor
Alt+C                              # Fuzzy cd into a subdirectory

# As a filter in scripts:
ls | fzf                           # Interactively pick one item from a list
cat file.txt | fzf                 # Filter any text output
rg --files | fzf                   # Pick a file from ripgrep's file list

# Preview files while browsing:
fzf --preview 'bat --color=always {}'   # Show bat-highlighted preview of each file
```

---

## rg (ripgrep) — Fast recursive search

```sh
rg "useState"                      # Search for a pattern in all files recursively
rg "useState" -t ts                # Restrict to TypeScript files only
rg "TODO" --hidden                 # Include hidden files and directories
rg "error" -l                      # List only the filenames that match (no line content)
rg "fetch" -C 3                    # Show 3 lines of context around each match
rg "console\.log" --stats          # Print match count and file count summary
rg "import.*supabase" features/    # Search only within a specific subdirectory
rg -e "foo" -e "bar"               # Match multiple patterns (OR)
```

---

## lazygit — Terminal git UI

```sh
lazygit                            # Open the TUI in the current repo

# Key bindings inside lazygit:
# space       Stage / unstage a file or hunk
# c           Commit staged changes
# p           Push
# P           Pull
# b           Branch management panel
# ?           Show all keybindings
```

---

## tldr — Simplified man pages

```sh
tldr git                           # Show the most common git commands with examples
tldr curl                          # Practical curl usage (much shorter than man curl)
tldr --list                        # List all commands with available pages
tldr --update                      # Update local page cache to latest
```

---

## jq — JSON processor

```sh
cat data.json | jq '.'                      # Pretty-print JSON
cat data.json | jq '.name'                  # Extract a top-level field
cat data.json | jq '.users[0]'              # Get first element of an array
cat data.json | jq '.users[] | .email'      # Pluck a field from every array element
cat data.json | jq '{id: .id, name: .name}' # Reshape into a new object
curl -s https://api.example.com | jq '.data[] | select(.active == true)'  # Filter array
jq -n '{key: "value"}'                      # Build JSON from scratch (no input file)
jq -r '.token'                              # Raw output — strips quotes (useful in scripts)
```

---

## openssl — Cryptographic utilities

```sh
openssl rand -hex 32               # Generate a 32-byte random secret as hex (use for CRON_SECRET, WEBHOOK_TOKEN, etc.)
openssl rand -base64 32            # Same but base64-encoded
openssl s_client -connect example.com:443   # Inspect a remote TLS certificate
openssl x509 -in cert.pem -text -noout      # Decode and print a certificate file
```

---

## Supabase CLI

```sh
npx supabase start                 # Start the local stack using supabase/config.toml
npx supabase stop                  # Stop the local stack and preserve data
npx supabase migration new <name>  # Create a new timestamped migration
npx supabase link --project-ref cvroudtyxsgllivlrayu --yes  # Link this checkout to webwidgets-dev only
npx supabase migration list --linked                       # Compare local and webwidgets-dev history
npx supabase db push --linked --dry-run                    # Required review before any remote push
npx supabase db push --linked --yes                        # Apply only the reviewed dry-run set
npx supabase gen types typescript --linked --schema public,graphql_public > apps/web/types/supabase.ts
```

The project link and authentication session stay machine-local under
`supabase/.temp`; never commit credentials or link this checkout to the
separate Worldview project. Regenerate and review types after every deployed
schema change.

## V1 worker

```sh
cd services/sync-worker
npm install                    # Install this independently managed service
npm run typecheck              # Type-check worker source without a production build
npm test                       # Run processor/restart/dead-letter/readiness tests
npm run format:check           # Verify worker formatting
npm run smoke                  # Run the canonical probe with SMOKE_* env configured
```

The supported production manifest is `render.yaml`. Deploy dark with
`WORKER_DRY_RUN=true`, `EMAIL_SYNC_ENABLED=false`, and
`SCHEDULE_OWNER=vercel`; see `docs/finalization/V1_WORKER_DEPLOYMENT.md` before
changing schedule ownership.

---

## General one-liners

```sh
openssl rand -hex 32               # Generate a secret key (JWT secret, webhook token, etc.)

lsof -ti:3000 | xargs kill -9      # Kill whatever is running on port 3000 (or any port)

cat file.json | pbcopy             # Copy file contents to clipboard
pbpaste > file.txt                 # Paste clipboard contents into a file

# Find and kill a process by name:
pkill -f "next dev"

# Watch a file for changes and print it:
while true; do clear; bat file.log; sleep 2; done

# Time how long a command takes:
time npm run build
```
