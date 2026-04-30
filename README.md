# Foxpix CLI

A lightweight local TypeScript + Node.js batch image optimizer for web-production workflows. It bulk-renames files, converts to WebP, preserves transparency, and writes a `manifest.json` report.

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Typecheck

```bash
npm run typecheck
```

## Test

```bash
npm run test
```

## CLI usage

```bash
npm run optimize -- --input ./input [options]
```

Options:

- `--input` (required)
- `--output` (default: `<input>/optimized`)
- `--prefix`
- `--pattern` (default: `{prefix}-{index}`)
- `--custom`
- `--quality` (default: `85`)
- `--alphaQuality` (default: `100`)
- `--lossless` (default: `false`)
- `--maxWidth`
- `--maxHeight`
- `--recursive` (default: `false`)
- `--dryRun` (default: `false`)
- `--keepMetadata` (default: `false`)

## Create sample images

```bash
npm run create-samples
```

This generates local fixtures under `sample-input/` for quick validation.

## Examples

```bash
npm run optimize -- --input ./input --prefix animal-habitat
npm run optimize -- --input ./input --output ./optimized --prefix sticker --quality 85 --alphaQuality 100
npm run optimize -- --input ./input --pattern "{prefix}-{name}-{index}" --prefix product
npm run optimize -- --input ./input --dryRun
```

## Rename patterns

Supported tokens:

- `{index}` (`001`, `002`, ...)
- `{name}`
- `{prefix}`
- `{folder}`
- `{custom}`

Collision-safe filenames are auto-suffixed (`-2`, `-3`, ...).

## Supported input types

- `.png`
- `.jpg`
- `.jpeg`
- `.webp`
- `.tiff`
- `.tif`
- `.avif`

## Transparency preservation notes

- The pipeline does **not** call `flatten()`.
- No background color is applied.
- Sharp writes WebP directly from source alpha channels.

Manual transparency check:

1. Run optimization on a transparent PNG.
2. Open the output WebP in a browser or image editor with checkerboard support.
3. Verify transparent areas remain transparent (not replaced with white/black).

## Local validation checklist

```bash
npm install
npm run create-samples
npm run optimize -- --input ./sample-input --prefix test --dryRun
npm run optimize -- --input ./sample-input --prefix test
npm run typecheck
npm run test
npm run build
```

## Recommended settings for web images

- `quality: 85`
- `alphaQuality: 100`
- `effort: 4`
- `lossless: false`
- `keepMetadata: false`

## Troubleshooting

- **Input folder error**: verify path exists and is a directory.
- **No files found**: ensure supported extensions are present.
- **Unexpected names**: validate `--pattern` tokens and `--prefix/--custom` values.
- **Large files after conversion**: try lower quality or enable resizing.
