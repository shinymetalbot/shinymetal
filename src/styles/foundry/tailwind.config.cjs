// Loads the approved Foundry preset (new_design_system/tailwind/preset.js, copied verbatim as preset.cjs).
module.exports = {
  presets: [require('./preset.cjs')],
  content: ['./src/**/*.{astro,html,js,ts,md}'],
};
