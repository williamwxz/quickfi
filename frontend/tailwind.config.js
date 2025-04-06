/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // Blue
        secondary: '#10B981', // Green
        accent: '#8B5CF6',  // Purple
        neutral: '#1F2937',
        'base-100': '#FFFFFF',
        'base-200': '#F3F4F6',
        'base-300': '#E5E7EB',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        quickfi: {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#8B5CF6',
          neutral: '#1F2937',
          'base-100': '#FFFFFF',
          'base-200': '#F3F4F6',
          'base-300': '#E5E7EB',
        },
      },
    ],
  },
} 