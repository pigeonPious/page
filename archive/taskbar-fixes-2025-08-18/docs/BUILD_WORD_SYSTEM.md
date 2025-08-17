# Build Word System

## Overview
The build word system provides a visual indicator in the taskbar to help identify which build/version is currently deployed. A random word appears on the right side of the taskbar that changes with each build.

## How It Works

1. **Word Generation**: The `generateBuildWord()` function in `modules/taskbar.js` contains an array of 50 distinctive words
2. **Build-Specific**: The word is generated using the build date as a seed, ensuring the same build always shows the same word
3. **Visual Display**: The word appears on the right side of the taskbar in small, monospace font

## Usage for Builds

When creating a new build:

1. Update the build date in `modules/taskbar.js`:
   ```javascript
   const buildDate = 'YYYYMMDD'; // Update this line
   ```

2. Update version numbers in HTML files:
   ```html
   <script src="modules/taskbar.js?v=YYYYMMDD"></script>
   ```

3. The build word will automatically change to reflect the new build

## Word List
The system uses 50 words including:
- NATO phonetic alphabet (alpha, beta, gamma, etc.)
- Colors and materials (crimson, azure, emerald, etc.)
- Precious materials (diamond, ruby, sapphire, etc.)

## Current Build: 20250820
Build word: **amber** (calculated from build date seed)

## Benefits
- Quick visual confirmation of deployed build
- No need to check console or version numbers
- Immediately visible on page load
- Consistent per build (same build = same word)
