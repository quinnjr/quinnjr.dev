import flowbite from 'flowbite/plugin';
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';
import aspectRatio from '@tailwindcss/aspect-ratio';

export default {
  darkMode: 'class',
  content: [
    './src/**/*.{html,ts}',
    './node_modules/flowbite/**/*.js'
  ],
  theme: {
    extend: {
      animation: {
        'tilt': 'tilt 10s infinite linear',
      },
      keyframes: {
        tilt: {
          '0%, 50%, 100%': {
            transform: 'rotate(0deg)',
          },
          '25%': {
            transform: 'rotate(1deg)',
          },
          '75%': {
            transform: 'rotate(-1deg)',
          },
        },
      },
    },
  },
  plugins: [
    flowbite,
    typography,
    forms,
    aspectRatio,
  ],
}

