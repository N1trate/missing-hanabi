chrome.runtime.onMessage.addListener((request) => {
  if (request === "showOptions") {
    chrome.runtime.openOptionsPage();
  }
});

chrome.runtime.onInstalled.addListener(async function(details) {
  if (details.reason === 'install') {
    // Set default values when the extension is first installed
    chrome.storage.sync.set({
      minEfficiency: 0,
      maxEfficiency: 1.4,
      maxVariants: 15,
      randomizeVariants: false,
      autoUpdate: true,
      hideButtons: false,
      wantedVariants: [],
      excludedVariants: ['Null', 'Omni', 'Blind', 'Mute', 'Clue Starved', 'Up or Down', 'Throw It in a Hole', 'Cow & Pig', 'Duck'],
      listedVariants: ['3 Suits', '-Fives', '-Ones', 'Pink', 'Mix', 'Ambiguous', 'Dual-Color', 'Alternating Clues', 'Synesthesia', 'Reversed', 'Critical Fours', 'Odds And Evens', 'Dark']
   });
  }
});