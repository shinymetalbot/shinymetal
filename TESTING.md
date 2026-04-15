# Testing the Titanium Coliseum Redesign

To test the newly applied redesign of the ShinyMetal.bot website locally, follow these steps:

## Prerequisites
- **Node.js**: Ensure you have Node.js installed (v18.17.1 or v20.3.0 or higher is recommended for Astro 4).
- **Package Manager**: `npm` is used in this project.

## Steps to Run Locally

### 1. Navigate to the Project Directory
Open your terminal and navigate to the `src` directory of the project:
```bash
cd /shared-workspaces/projects/shinymetal-bot/src/
```

### 2. Install Dependencies
If you are running this on a new machine or if `node_modules` are missing, install the required packages:
```bash
npm install
```

### 3. Start the Development Server
Run the following command to start the Astro development server. This provides Hot Module Replacement (HMR) so you can see changes in real-time if you make further edits:
```bash
npm run dev
```
By default, the site will be available at `http://localhost:4321/`.

### 4. Build and Preview (Optional)
To see the site exactly as it would appear in production (optimized):
```bash
npm run build
npm run preview
```
This will build the site and serve the static files, typically at `http://localhost:4321/` or another port indicated in the terminal.

## Key Pages to Verify
- **Home**: `http://localhost:4321/` (index.astro)
- **Benchmarks**: `http://localhost:4321/benchmarks` (benchmarks.astro)
- **About**: `http://localhost:4321/about` (about.astro)
- **Pricing**: `http://localhost:4321/pricing` (pricing.astro)

## Troubleshooting
- **CSS Issues**: If styles don't appear correctly, ensure `npm run dev` is running and check for any errors in the terminal regarding Tailwind compilation.
- **Font Rendering**: The design uses 'Space Grotesk' and 'Manrope' via Google Fonts. Ensure you have an active internet connection for fonts to load correctly.
- **Icons**: 'Material Symbols Outlined' are used for iconography; these also require an internet connection to fetch the icon font.
