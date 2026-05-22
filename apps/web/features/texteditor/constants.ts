// Things 3 inspired editor styles — minimal, high whitespace, clean typography
export const TE_STYLES = `
    .te-editor p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: left; color: #a8a29e; pointer-events: none; height: 0;
        font-style: normal;
    }
    .dark .te-editor p.is-editor-empty:first-child::before { color: #52525b; }
    .te-editor:focus-visible { outline: none; }
    .te-editor p { margin: 0 0 0.6rem; line-height: 1.75; }
    .te-editor h1 { font-size: 1.4rem; font-weight: 600; letter-spacing: -0.02em; margin: 1.5rem 0 0.5rem; }
    .te-editor h2 { font-size: 1.15rem; font-weight: 600; letter-spacing: -0.01em; margin: 1.25rem 0 0.4rem; }
    .te-editor h3 { font-size: 1rem; font-weight: 600; margin: 1rem 0 0.3rem; }
    .te-editor blockquote {
        border-left: 2px solid rgba(0,0,0,0.1); padding-left: 1.1rem;
        color: #78716c; font-style: italic; margin: 0.75rem 0;
    }
    .dark .te-editor blockquote { border-color: rgba(255,255,255,0.1); color: #71717a; }
    .te-editor ul, .te-editor ol { padding-left: 1.4rem; margin: 0 0 0.5rem; }
    .te-editor li { margin: 0.2rem 0; line-height: 1.7; }
    .te-editor strong { font-weight: 600; }
    .te-editor em { font-style: italic; }
    .te-editor s { text-decoration: line-through; opacity: 0.6; }
    .te-editor hr { border: none; border-top: 1px solid rgba(0,0,0,0.07); margin: 1.25rem 0; }
    .dark .te-editor hr { border-color: rgba(255,255,255,0.07); }
`;
