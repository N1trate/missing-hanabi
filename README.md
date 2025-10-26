# Missing Hanabi - Find Interesting Missing Variants

This project provides tools to help you find missing Hanabi variants for you and your pregame partners on hanab.live.

**Two options available:**
- 🌐 **Chrome Extension** - Easy-to-use browser extension (recommended for most users)
- 🐍 **Python Script** - Command-line tool with more advanced options, on the git branch named "python"

## READ ME FIRST!

You should **NEVER** run code taken randomly on the internet.  
If you plan to run this code, you SHOULD read it all.  
This code is not meant to harm you in any way and is published without any warranty that it will do what is expected.  
If you're still interested: GL HF.

## Chrome Extension (Recommended)

The Chrome extension provides an easy-to-use interface for finding missing variants directly on hanab.live.

### Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/` or click the three-dot menu → More Tools → Extensions
3. In the top-right corner, toggle "Developer mode" ON
4. Click "Load unpacked"
5. Select the `missing-hanabi` directory from this repository
6. The extension should now appear in your extensions list

### Usage

1. Navigate to hanab.live and join a pregame lobby
2. Click the option gear "⚙️" to open your preferences
3. Configure your preferences (wanted/excluded variants, efficiency range, ...)
4. Get variants in the panel, or click the "Find Missing Variant" button to refresh the list
5. Clicking on an item will automatically update the table, either as a table leader or offering the variant to the table leader

### Optional Settings

- **Efficiency Range**: Minimum and maximum efficiency values (default: 0 to 1.4)
- **Number to Display**: Amount of variant to limit the list to
- **Randomize Variants**: Randomize the list before showing it in the panel
- **Auto-Update**: Update the list when players are joining or leaving the pre-game lobby
- **Hide Join/Spectate Buttons**: Remove the new button if your muscle memory is too strong
- **Wanted Variants**: Variants you want to prioritize (one per line)
  - These will be included even if they match exclusion rules
  - These will be prioritize over giving random variants if randomization is selected
  - Glob matching applies (e.g., "Pink" matches "Pink (5 Suits)" and "Omni & Gray Pink (5 Suits)")
- **Excluded Variants**: Variants you want to filter out (one per line)
  - Any variant containing these strings (case-insensitive) will be excluded
  - Glob matching applies (e.g., "Pink" matches "Pink (5 Suits)" and "Omni & Gray Pink (5 Suits)")
  - Default exclusions: Null, Omni, Blind, Mute, Clue Starved, Up or Down, Throw It in a Hole, Cow & Pig, Duck

## Tips & Tricks

💡 **Glob Matching:** "Pink" will match "Pink (5 Suits)", "Pink (6 Suits)", "Dark Pink", "Omni & Gray Pink (5 Suits)" etc.

💡 **Wanted Override:** Variants in your "Wanted" list will show up even if they match exclusions

💡 **Efficiency Values:** 
- 0.0 - 1.0: Easier variants
- 1.0 - 1.33: Medium difficulty
- 1.33+: Hard variants

## Troubleshooting

### ❌ "Not in a pregame lobby"
- Make sure you're on hanab.live and have joined or created a pregame table
- The pregame lobby should be visible on your screen

### ❌ "Could not find players"
- Verify you're in an active pregame lobby
- Try refreshing the page and rejoining the pregame

### ❌ "No variants match criteria"
- Try adjusting your efficiency range
- Review your excluded variants list - you may be filtering out too many variants
- Check that your wanted variants are spelled correctly

### ❌ Panel does not appear
- Refresh the hanab.live page

## Updating the Extension

When you pull updates from the repository:

1. Go to `chrome://extensions/`
2. Find the "Missing Hanabi Variant Finder" extension
3. Click the reload icon (circular arrow)
4. Your settings will be preserved

## Uninstalling

1. Go to `chrome://extensions/`
2. Find the "Missing Hanabi Variant Finder" extension
3. Click "Remove"
4. Confirm the removal

Note: This will also delete your saved configuration.

## How to improve the project

This project is still experimental. You may help improve it by opening issues or creating pull requests. I do not guarantee any timely answer, but will appreciate your help and opinion.