export const PawnIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
        <path d="M15 9H9a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Z" />
        <path d="M8 15h8l1 4H7l1-4Z" />
        <path d="M7 19h10v2H7v-2Z" />
    </svg>
);
