export const TIPTAP_STYLES = `
    .tiptap p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left; color: #a8a29e; pointer-events: none; height: 0;
    }
    .dark .tiptap p.is-editor-empty:first-child::before { color: #52525b; }
    .tiptap:focus-visible { outline: none; }
    .tiptap h2 { font-size: 1.2rem; font-weight: 700; margin: 0.75rem 0 0.25rem; font-family: Georgia, serif; }
    .tiptap h3 { font-size: 1rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
    .tiptap blockquote {
    border-left: 3px solid #d6d3d1; padding-left: 1rem;
    color: #78716c; font-style: italic; margin: 0.5rem 0;
    }
    .dark .tiptap blockquote { border-color: #3f3f46; color: #a1a1aa; }
    .tiptap ul, .tiptap ol { padding-left: 1.25rem; }
    .tiptap li { margin: 0.2rem 0; }
    .tiptap p { margin: 0.25rem 0; }
`;