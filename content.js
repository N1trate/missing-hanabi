async function getPlayersFromPregame() {
  try {
    // Look for player names in the pregame lobby
    // Since we're on the pre-game page, we can directly find players
    const players = [];
    
    // Method 1: Check for .lobby-pregame-player elements (the most direct method for pregame page)
    const pregamePlayers = document.querySelectorAll('.lobby-pregame-player');
    if (pregamePlayers.length > 0) {
      pregamePlayers.forEach(playerElement => {
        // Look for the <p> element within each player entry
        const nameElement = playerElement.querySelector('p');
        if (nameElement) {
          const name = getPlayerNameFromElement(nameElement);
          if (name) {
            players.push(name);
          }
        }
      });
    }
    
    // Method 2: Check if window.globals exists (hanabi.live's internal state)
    if (players.length === 0 && typeof window.globals !== 'undefined' && window.globals && window.globals.tableID) {
      // The user is at a table, try to get players from globals
      if (window.globals.ui && window.globals.ui.peopleAtTable) {
        const tableParticipants = window.globals.ui.peopleAtTable;
        if (Array.isArray(tableParticipants)) {
          players.push(...tableParticipants);
        }
      }
    }
    
    const uniquePlayers = [...new Set(players)]; // Remove duplicates
    
    if (uniquePlayers.length === 0) {
      console.log('Debug: Could not find players. DOM structure might have changed.');
      console.log('Debug: Please check if pregame chat is visible and you are in a pregame lobby.');
    }
    
    return uniquePlayers;
  } catch (error) {
    console.error('Error getting players:', error);
    throw new Error('Could not extract player list from page');
  }
}

async function getMissingVariants(players, numPlayers) {
  try {
    const url = `${window.location.origin}/shared-missing-scores/${numPlayers}/${players.join('/')}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch missing variants from server');
    }
    
    const html = await response.text();
    
    // Parse the HTML to extract variants
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('tr.missing-scores-row');
    
    const missings = [];
    rows.forEach(row => {
      const cells = Array.from(row.children).map(cell => cell.textContent.trim()).filter(text => text);
      if (cells.length >= 2) {
        const variantName = cells[0];
        const efficiency = parseFloat(cells[cells.length - 1]);
        if (variantName && !isNaN(efficiency)) {
          missings.push([variantName, efficiency]);
        }
      }
    });
    
    return missings;
  } catch (error) {
    console.error('Error fetching missing variants:', error);
    throw new Error('Failed to fetch missing variants: ' + error.message);
  }
}

function filterVariants(missings, config) {
  const exclusions = config.excludedVariants.map(x => x.toLowerCase());
  const wantedVars = config.wantedVariants.map(x => x.toLowerCase());
  const minEff = config.minEfficiency;
  const maxEff = config.maxEfficiency;
  
  var filtered = [];
  const wantedFiltered = [];
  
  for (const [name, eff] of missings) {
    // Check efficiency range (always applied)
    if (eff < minEff || eff > maxEff) {
      continue;
    }
    
    const nameLower = name.toLowerCase();
    
    // Check if it's a wanted variant (fuzzy match using includes)
    // Wanted variants bypass exclusions as per the problem statement:
    // "Those variant will show up even if the exclusion further down should hide them"
    const isWanted = wantedVars.some(wanted => nameLower.includes(wanted));
    
    if (isWanted) {
      wantedFiltered.push([name, eff]);
      continue;
    }
    
    // Check exclusions (only for non-wanted variants)
    const isExcluded = exclusions.some(excluded => nameLower.includes(excluded));
    
    if (!isExcluded) {
      filtered.push([name, eff]);
    }
  }

  // Randomize if enabled
  if (config.randomizeVariants) {
    filtered = shuffleArray(filtered);
  }
  
  // Prioritize wanted variants by putting them first
  return [...wantedFiltered, ...filtered];
}

const disabledPlayers = new Set();

function getPlayerNameFromElement(nameElement) {
  // The name lives inside the <strong> wrapper; read from there so our
  // toggle icon (prepended to the <p>) is not picked up as part of the name
  const nameContainer = nameElement.querySelector('strong') || nameElement;
  var name = nameContainer.textContent.trim();
  const span = nameContainer.querySelector('span');
  if (span && span.classList.contains('unShadow') && name.endsWith('🕵️')) {
    // Remove the investigator emoji and trailing space
    name = name.slice(0, -('🕵️'.length)).trim();
  }
  return name;
}

function applyNameToggleStyle(nameElement, disabled) {
  const icon = nameElement.querySelector('.missing-hanabi-toggle');
  if (icon) {
    const glyph = disabled ? '🚫' : '✅';
    // Only touch the DOM on an actual change: this runs from the mutation
    // observer, and rewriting the text node would retrigger it endlessly
    if (icon.textContent !== glyph) {
      icon.textContent = glyph;
    }
    icon.style.color = disabled ? '#f44336' : '#4CAF50';
  }

  const nameContainer = nameElement.querySelector('strong');
  if (nameContainer) {
    nameContainer.style.textDecoration = disabled ? 'line-through' : '';
    nameContainer.style.opacity = disabled ? '0.5' : '';
  }
}

function setupLobbyNameToggles() {
  document.querySelectorAll('.lobby-pregame-player').forEach(playerElement => {
    const nameElement = playerElement.querySelector('p');
    if (!nameElement) {
      return;
    }

    const name = getPlayerNameFromElement(nameElement);
    if (!name) {
      return;
    }

    if (!nameElement.querySelector('.missing-hanabi-toggle')) {
      const icon = document.createElement('span');
      icon.className = 'missing-hanabi-toggle';
      icon.title = 'Click to exclude/include this player in the missing variant search';
      icon.style.cssText = `
        cursor: pointer;
        margin-right: 0.3em;
        font-size: 0.85em;
      `;

      icon.addEventListener('click', async (event) => {
        // Keep the click away from the site's own handlers (e.g. the
        // shadow/unshadow feature while spectating)
        event.stopPropagation();

        const currentName = getPlayerNameFromElement(nameElement);
        if (disabledPlayers.has(currentName)) {
          disabledPlayers.delete(currentName);
        } else {
          disabledPlayers.add(currentName);
        }
        applyNameToggleStyle(nameElement, disabledPlayers.has(currentName));

        const button = document.getElementById('missing-hanabi-button');
        const resultsContainer = document.getElementById('missing-hanabi-results');
        if (button && resultsContainer) {
          await findAndDisplayVariants(button, resultsContainer);
        }
      });

      nameElement.prepend(icon);
    }

    applyNameToggleStyle(nameElement, disabledPlayers.has(name));
  });
}

// Create and add the right panel for displaying variants
function createVariantPanel() {
  // Check if panel already exists
  if (document.getElementById('missing-hanabi-panel')) {
    return;
  }
  
  // Create the panel container
  const panel = document.createElement('div');
  panel.id = 'missing-hanabi-panel';
  panel.style.cssText = `
    position: fixed;
    top: 60px;
    right: 10px;
    width: 280px;
    height: calc(100vh - 80px);
    background-color: #2b2b2b;
    border: 2px solid #444;
    border-radius: 8px;
    display: none;
    flex-direction: column;
    overflow: hidden;
    transition: height 0.18s ease-out;
    z-index: 1000;
    font-family: Arial, sans-serif;
    line-height: 1em;
  `;
  
  // Create the header
  const header = document.createElement('div');
  header.style.cssText = `
    box-sizing: border-box;
    height: 44px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #1a1a1a;
    border-bottom: 2px solid #444;
    border-radius: 6px 6px 0 0;
    cursor: pointer;
    transition: background-color 0.15s ease-out;
  `;
  header.title = 'Collapse';
  header.innerHTML = '<strong style="color: #fff; font-size: 14px;">Missing Variants</strong>';
  
  header.addEventListener('mouseenter', () => {
    header.style.backgroundColor = '#2a2a2a';
  });

  header.addEventListener('mouseleave', () => {
    header.style.backgroundColor = '#1a1a1a';
  });

  const configButton = document.createElement('button');
  configButton.textContent = '⚙️';
  configButton.style.cssText = `
    background-color: transparent;
    color: #fff;
    cursor: pointer;
    position: fixed;
    top: 71px;
    right: 15px;
  `;

  configButton.addEventListener('click', (e) => {
    e.stopPropagation();
    chrome.runtime.sendMessage("showOptions");
  });
  header.appendChild(configButton);

  // Body wrapper for everything below the header. It keeps its natural
  // height while the panel's height animates, so the shrinking panel clips
  // the content from the bottom (a roll-up) instead of squashing it
  const panelBody = document.createElement('div');
  panelBody.style.cssText = `
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: calc(100vh - 80px - 44px);
    transition: opacity 0.18s ease-out;
  `;
  
  let collapsed = false;
  header.addEventListener('click', () => {
    collapsed = !collapsed;
    panel.style.height = collapsed ? '44px' : 'calc(100vh - 80px)';
    panelBody.style.opacity = collapsed ? '0' : '1';
    header.title = collapsed ? 'Expand' : 'Collapse';
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    panel.style.transition = 'none';
    panelBody.style.transition = 'none';
  }

  // Create the results container
  const resultsContainer = document.createElement('div');
  resultsContainer.id = 'missing-hanabi-results';
  resultsContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    color: #fff;
  `;
  
  // Create the button
  const button = document.createElement('button');
  button.id = 'missing-hanabi-button';
  button.textContent = 'Find Missing Variant';
  button.style.cssText = `
    width: calc(100% - 20px);
    margin: 10px;
    padding: 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
  `;
  
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#45a049';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#4CAF50';
  });
  
  button.addEventListener('click', async () => {
    await findAndDisplayVariants(button, resultsContainer);
  });
  
  // Assemble the panel
  panel.appendChild(header);
  panelBody.appendChild(resultsContainer);
  panelBody.appendChild(button);
  panel.appendChild(panelBody);
  
  // Add to page
  document.body.appendChild(panel);
}

// Find variants and display them in the results panel
async function findAndDisplayVariants(button, resultsContainer) {
  button.disabled = true;
  button.textContent = 'Finding...';
  resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #aaa;">Loading...</div>';
  
  try {
    const config = await chrome.storage.sync.get({
      minEfficiency: 0,
      maxEfficiency: 1.4,
      maxVariants: 15,
      randomizeVariants: false,
      wantedVariants: [],
      excludedVariants: [],
      listedVariants: []
    });
    
    // Get players from the pregame table
    const players = await getPlayersFromPregame();
    
    if (!players || players.length < 2) {
      resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #f44336;">Need at least 2 players</div>';
      button.textContent = 'Find Missing Variant';
      button.disabled = false;
      return;
    }

    // Forget disabled players that are no longer at the table
    for (const disabled of disabledPlayers) {
      if (!players.includes(disabled)) {
        disabledPlayers.delete(disabled);
      }
    }

    setupLobbyNameToggles();

    const activePlayers = players.filter(p => !disabledPlayers.has(p));

    if (activePlayers.length < 2) {
      resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #f44336;">Need at least 2 active players</div>';
      button.textContent = 'Find Missing Variant';
      button.disabled = false;
      return;
    }
    
    // Fetch missing variants
    const missings = await getMissingVariants(activePlayers, players.length);
    
    if (!missings || missings.length === 0) {
      resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #f44336;">No missing variants found</div>';
      button.textContent = 'Find Missing Variant';
      button.disabled = false;
      return;
    }
    
    // Filter variants based on config
    let filtered = filterVariants(missings, config);
    
    if (filtered.length === 0) {
      resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #f44336;">No variants match criteria</div>';
      button.textContent = 'Find Missing Variant';
      button.disabled = false;
      return;
    }
    
    // Display the results (limit to maxVariants)
    const variantsToShow = filtered.slice(0, config.maxVariants);
    displayVariantList(resultsContainer, variantsToShow);
    
    button.textContent = 'Find Missing Variant';
    button.disabled = false;
    
  } catch (error) {
    console.error('Error finding variants:', error);
    resultsContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: #f44336;">Error: ${error.message}</div>`;
    button.textContent = 'Find Missing Variant';
    button.disabled = false;
  }
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Display the list of variants in the results container
function displayVariantList(container, variants) {
  container.innerHTML = '';
  
  variants.forEach(([name, efficiency]) => {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      padding: 8px;
      margin-bottom: 6px;
      background-color: #333;
      border-radius: 4px;
      cursor: pointer;
    `;
    
    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = '#444';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = '#333';
    });
    
    // Create text container
    const textContainer = document.createElement('div');
    textContainer.style.cssText = `
      flex: 1;
      min-width: 0;
    `;
    
    const variantName = document.createElement('div');
    variantName.textContent = name;
    variantName.style.cssText = `
      color: #fff;
      font-size: 13px;
      font-weight: bold;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
    `;
    
    const efficiencyText = document.createElement('div');
    efficiencyText.textContent = `Efficiency: ${efficiency.toFixed(2)}`;
    efficiencyText.style.cssText = `
      color: #aaa;
      font-size: 11px;
      margin-top: 2px;
      text-align: center;
    `;
    
    textContainer.appendChild(variantName);
    textContainer.appendChild(efficiencyText);
    
    item.appendChild(textContainer);
    
    // Make entire item clickable
    item.addEventListener('click', () => {
      sendVariantAndFocusChat(name);
    });
    
    container.appendChild(item);
  });
}

// Send the variant command to the chat
function sendVariantAndFocusChat(variantName) {
  const pregameInput = document.getElementById('lobby-chat-pregame-input');
  if (pregameInput) {
    window.postMessage({ type: 'chatCommandInjection', payload: variantName}, '*');
    pregameInput.focus();
  }
}

// Store references for auto-update
let currentPlayerList = '';
let autoUpdateEnabled = true;

// Check and hide buttons if configured
async function hideButtonsIfConfigured() {
  const config = await chrome.storage.sync.get({ hideButtons: false });
  
  if (config.hideButtons) {
    const joinButton = document.getElementById('nav-buttons-pregame-join');
    if (joinButton && joinButton.parentElement) {
      joinButton.parentElement.remove();
    }
    
    const spectateButton = document.getElementById('nav-buttons-pregame-spectate');
    if (spectateButton && spectateButton.parentElement) {
      spectateButton.parentElement.remove();
    }
  }
}

// Auto-update variants when players change
async function checkForPlayerChanges() {
  // The site rebuilds each player box on every lobby update, wiping our
  // click handlers and styling, so always reattach them first
  setupLobbyNameToggles();

  const resultsContainer = document.getElementById('missing-hanabi-results');
  if (resultsContainer.style.display === 'none') {
    return; // Panel is hidden, skip updates
  }

  const config = await chrome.storage.sync.get({ autoUpdate: true });
  
  if (!config.autoUpdate) {
    return;
  }
  
  const players = await getPlayersFromPregame();
  const newPlayerList = players ? players.join('/') : '';

  if (newPlayerList !== currentPlayerList) {
    currentPlayerList = newPlayerList;
    const newPlayerCount = players ? players.length : 0;

    const button = document.getElementById('missing-hanabi-button');
    if (button && resultsContainer) {
      if (newPlayerCount < 2) {
        // Clear the list if less than 2 players
        resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #aaa;">Waiting for players...</div>';
      } else if (newPlayerCount >= 2) {
        // Auto-load variants if 2 or more players
        await findAndDisplayVariants(button, resultsContainer);
      }
    }
  }
}

// Initial setup
createVariantPanel();
hideButtonsIfConfigured();

const lobbydiv = document.getElementById('lobby-pregame');
const lobbyCallback = (mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.type === "attributes") {
      if (mutation.attributeName !== 'style') {
        return;
      }

      var panel = document.getElementById('missing-hanabi-panel');
      if (!panel) {
        return;
      }

      if (lobbydiv.style.display === 'none') {
        // Lobby is hidden, hide panel too
        panel.style.display = 'none';
        return;
      }
      // Lobby is visible, make panel visible too
      panel.style.display = 'flex';
    }
  }
};

// Start observing the target node for configured mutations
if (lobbydiv) {
  // Create an observer instance linked to the callback function
  const lobbyObserver = new MutationObserver(lobbyCallback);
  lobbyObserver.observe(lobbydiv, { attributes: true, childList: false, subtree: false });
}

// Watch for player changes specifically
const playerObserver = new MutationObserver(() => {
  checkForPlayerChanges();
});

// Start observing player list changes
setTimeout(() => {
  const playerContainer = document.querySelector('.lobby-pregame-players');
  if (playerContainer) {
    playerObserver.observe(playerContainer, {
      childList: true,
      subtree: true
    });
  }
  
  // Also check initially
  checkForPlayerChanges();
}, 1000);

const commandInjection = document.getElementById('chatCommandInjection');
if (!commandInjection) {
    var node = document.getElementsByTagName('body')[0];
    var script = document.createElement('script');
    script.setAttribute('id', 'chatCommandInjection');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', chrome.runtime.getURL('chatCommandInjection.js'));
    node.appendChild(script);
}