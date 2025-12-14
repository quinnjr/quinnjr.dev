/** @type {import('tailwindcss').Config} */
export default {
  // Content paths for Tailwind v4
  content: [
    './src/**/*.{html,ts,scss,css}',
    './node_modules/flowbite/**/*.js'
  ],
  // Note: In Tailwind v4, theme configuration is now in CSS (@theme directive)
  // See src/tailwind.css for theme configuration
  // Plugins are also declared in CSS using @plugin directive
}

