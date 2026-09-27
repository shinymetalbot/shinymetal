// Loads the approved Foundry preset (docs/design-system/tailwind/preset.js, copied verbatim as preset.cjs).
module.exports = {
  presets: [require('./preset.cjs')],
  content: ['./src/**/*.{astro,html,js,ts,md}'],
};
