# Problems

- Issue button should change if usres are in accessibility mode
- Confusion between what should be managed by widget, Go service, import-export and runtime manager
- TipTap/editor focus steal pattern: do not key editor components or run
  `editor.commands.setContent()`, `.focus()`, or `.blur()` from effects that
  depend on mutable `title`, `content`, `updated_at`, or refreshed entry objects.
  Autosave/refresh will replay the effect while the user types and can kick the
  caret from a title input into the editor body. Sync editor title/content only
  when stable identity changes (`entry.id`, `noteType`, etc.), keep latest entry
  data in refs for the sync effect, and update same-entry autosave state without
  remounting or imperative focus changes. Known fixed sites:
  `apps/web/features/texteditor/components/WidgetNoteEditor.tsx` and
  `apps/web/features/texteditor/hooks/useRichEditorState.ts`.
