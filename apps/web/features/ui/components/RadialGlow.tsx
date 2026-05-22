export const RadialGlow = () => {
    return (
        <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150px rounded-full opacity-10 pointer-events-none"
            style={{
                background:
                    'radial-gradient(circle, #4f6ef7 0%, transparent 70%)',
            }}
        />
    );
};
