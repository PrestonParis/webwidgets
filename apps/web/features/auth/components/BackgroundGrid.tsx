export const BackgroundGrid = () => {
    return (
        <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
                backgroundImage:
                    'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                backgroundSize: '48px 48px',
            }}
        />
    );
};
