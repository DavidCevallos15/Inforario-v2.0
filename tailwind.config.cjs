module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0E27',
        foreground: '#E0E7FF',
        card: '#151B3B',
        'card-foreground': '#E0E7FF',
        popover: '#151B3B',
        'popover-foreground': '#E0E7FF',
        primary: '#00F0FF',
        'primary-foreground': '#0A0E27',
        secondary: '#FF006E',
        'secondary-foreground': '#FFFFFF',
        muted: '#1E2749',
        'muted-foreground': '#8B92B0',
        accent: '#FFBE0B',
        'accent-foreground': '#0A0E27',
        destructive: '#FF006E',
        'destructive-foreground': '#FFFFFF',
        border: '#1E2749',
        'border-glow': '#00F0FF',
        input: '#151B3B',
        ring: '#00F0FF',
        utm: '#00F0FF',
        conflict: '#FF006E',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        first: 'moveVertical 30s ease infinite',
        second: 'moveInCircle 20s reverse infinite',
        third: 'moveInCircle 40s linear infinite',
        fourth: 'moveHorizontal 40s ease infinite',
        fifth: 'moveInCircle 20s ease infinite',
      },
      keyframes: {
        moveHorizontal: {
          '0%': { transform: 'translateX(-50%) translateY(-10%)' },
          '50%': { transform: 'translateX(50%) translateY(10%)' },
          '100%': { transform: 'translateX(-50%) translateY(-10%)' },
        },
        moveVertical: {
          '0%': { transform: 'translateY(-50%)' },
          '50%': { transform: 'translateY(50%)' },
          '100%': { transform: 'translateY(-50%)' },
        },
        moveInCircle: {
          '0%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(180deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};
