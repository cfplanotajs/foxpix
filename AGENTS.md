# AGENTS.md

## Project mission

Build a lightweight local image-processing utility for web-production workflows.

The app should help users bulk-rename, bulk-compress, and convert image files to optimized WebP while preserving alpha transparency. The primary use case is preparing large batches of product, sticker, illustration, and web assets for Shopify or other web projects.

The tool should prioritize reliability, predictable output, and a clean workflow over feature bloat.

## MVP scope

Create a local image-processing utility with these core capabilities:

1. Select or provide a folder of images.
2. Detect supported image files:
   - `.png`
   - `.jpg`
   - `.jpeg`
   - `.webp`
   - optionally `.tiff` and `.avif` if supported easily
3. Preview the batch list before processing.
4. Allow a filename pattern such as:
   - `{index}-{name}`
   - `{prefix}-{index}`
   - `{folder}-{index}`
   - `{custom}-{index}`
5. Slugify output filenames:
   - lowercase
   - hyphen-separated
   - remove unsafe characters
   - no spaces
6. Convert output images to `.webp`.
7. Preserve transparency when source files have alpha channels.
8. Expose basic WebP settings:
   - quality, default `85`
   - alpha quality, default `100`
   - effort, default `4`
   - optional lossless toggle
9. Allow optional resizing:
   - max width
   - max height
   - preserve aspect ratio
   - never upscale unless the user explicitly enables it
10. Export files into a new output folder:
   - default: `/optimized`
11. Generate a manifest file:
   - `manifest.json`
   - include original filename
   - output filename
   - original size
   - output size
   - width
   - height
   - compression percentage
   - processing status

## Recommended technical direction

Use Node.js and Sharp for image processing.

Preferred stack:

- TypeScript
- Node.js
- Sharp
- Electron or a simple local app shell if building a GUI
- React only if useful for the interface
- Keep the image-processing logic independent from the UI

If GUI complexity slows progress, prioritize a working CLI first, then layer the GUI on top.

## Architecture expectations

Keep the project modular:

```txt
src/
  core/
    processImages.ts
    rename.ts
    slugify.ts
    manifest.ts
    fileDiscovery.ts
  cli/
    index.ts
  ui/
    optional GUI files
  types/
    index.ts
```

The core image pipeline should not depend on the UI.

## Processing rules

- Never overwrite original source files.
- Always write output to a separate folder.
- If output filename already exists, append a safe suffix:
  - `-2`
  - `-3`
  - etc.
- Preserve transparent backgrounds.
- Do not flatten transparent PNGs onto white or black.
- Do not strip alpha unless the user explicitly requests it.
- Handle failed files gracefully and continue processing the rest of the batch.
- Log clear errors for failed files.
- Keep defaults web-friendly:
  - WebP quality: `85`
  - Alpha quality: `100`
  - Effort: `4`
  - Lossless: off by default
  - Metadata: stripped by default unless explicitly enabled

## UX principles

The app should feel like an internal production tool:

- clean
- fast
- predictable
- minimal
- no unnecessary onboarding
- no decorative UI bloat

The main workflow should be:

1. Choose input folder.
2. Choose output folder or use default.
3. Set rename pattern.
4. Set compression options.
5. Preview output names.
6. Run batch.
7. See completion summary.
8. Open output folder.

## Coding conventions

- Use TypeScript.
- Prefer small pure functions.
- Add types for all public function inputs and outputs.
- Avoid large monolithic files.
- Avoid unnecessary dependencies.
- Do not introduce cloud services.
- Do not upload images anywhere.
- Everything must run locally.
- Keep code readable for future non-specialist maintenance.

## CLI expectations

If building the CLI, support a command like:

```bash
npm run optimize -- --input ./input --output ./optimized --prefix animal-habitat --quality 85 --alphaQuality 100
```

Useful options:

```bash
--input
--output
--prefix
--pattern
--quality
--alphaQuality
--lossless
--maxWidth
--maxHeight
--dryRun
--recursive
```

The `--dryRun` mode should show planned filename changes without writing files.

## GUI expectations

If building the GUI, include:

- folder picker
- output folder picker
- rename pattern input
- prefix/custom name input
- quality slider
- alpha quality slider
- max width / max height fields
- lossless toggle
- recursive folder toggle
- dry run / preview button
- process button
- progress indicator
- summary after completion

Do not overdesign the UI. Functional clarity wins.

## Testing expectations

Add tests for:

- slugifying filenames
- rename pattern generation
- duplicate filename handling
- manifest generation
- dry run output
- alpha-preserving conversion where feasible

Use simple test fixtures.

## Definition of done

A task is done only when:

- the project installs successfully
- TypeScript passes
- the main command runs successfully on sample images
- converted WebP files are created in the output folder
- transparent PNG input remains transparent after WebP export
- generated filenames match the selected naming pattern
- no source files are modified
- manifest file is generated
- README includes setup and usage instructions

## README expectations

Document:

- what the tool does
- installation
- CLI usage
- GUI usage if applicable
- supported file types
- recommended settings for web images
- transparency preservation notes
- example before/after filenames
- troubleshooting

## Do not do

- Do not build user accounts.
- Do not add cloud storage.
- Do not add subscriptions.
- Do not add AI image editing.
- Do not create a complex media asset manager.
- Do not overwrite originals.
- Do not silently delete files.
- Do not require paid APIs.
