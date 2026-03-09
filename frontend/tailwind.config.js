/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f5f7ff',
                    100: '#ebefff',
                    200: '#d6deff',
                    300: '#b3c2ff',
                    400: '#859aff',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#3f36c5',
                    800: '#352da3',
                    900: '#2e2881',
                },
            },
        },
    },
    plugins: [],
}
