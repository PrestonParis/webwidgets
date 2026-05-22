/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        './features/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#4f6ef7',
                    hover: '#3a58e0',
                    light: '#7b93f9',
                    muted: '#eef2ff',
                    dark: '#172033',
                },
            },
            boxShadow: {
                widget: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
                'widget-lg': '0 4px 12px 0 rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
            },
            borderRadius: {
                widget: '1rem',
            },
        },
    },
    plugins: [
        function ({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
            addUtilities({
                '.pb-safe': { paddingBottom: 'env(safe-area-inset-bottom, 0px)' },
                '.pt-safe': { paddingTop: 'env(safe-area-inset-top, 0px)' },
                '.safe-area-inset-bottom': { paddingBottom: 'env(safe-area-inset-bottom, 0px)' },
            });
        },
    ],
};
