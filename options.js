// Global state for table sorting
let sortColumn = 'filter';
let sortDirection = 'asc';

// Load saved configuration
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({
    minEfficiency: 0,
    maxEfficiency: 1.4,
    maxVariants: 15,
    randomizeVariants: false,
    autoUpdate: true,
    hideButtons: false,
    wantedVariants: [],
    excludedVariants: [],
    listedVariants: []
  }, (items) => {
    document.getElementById('minEfficiency').value = items.minEfficiency;
    document.getElementById('maxEfficiency').value = items.maxEfficiency;
    document.getElementById('maxVariants').value = items.maxVariants;
    document.getElementById('randomizeVariants').checked = items.randomizeVariants;
    document.getElementById('autoUpdate').checked = items.autoUpdate;
    document.getElementById('hideButtons').checked = items.hideButtons;
    
    // Populate table with all variants
    populateVariantsTable(items.wantedVariants, items.excludedVariants, items.listedVariants);
  });
  
  // Setup event listeners
  document.getElementById('minEfficiency').addEventListener('change', handleEfficiencyChange);
  document.getElementById('maxEfficiency').addEventListener('change', handleEfficiencyChange);

  document.getElementById('maxVariants').addEventListener('change', handleMaxVariantsChange);

  document.getElementById('randomizeVariants').addEventListener('change', handleCheckboxChange);
  document.getElementById('autoUpdate').addEventListener('change', handleCheckboxChange);
  document.getElementById('hideButtons').addEventListener('change', handleCheckboxChange);

  setupTableSorting();
  document.getElementById('addVariantButton').addEventListener('click', addNewVariant);
  document.getElementById('newVariantFilter').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addNewVariant();
    }
  });
  
});

function handleEfficiencyChange(event) {
  const element = event.target;
  const val = parseFloat(element.value);

  if (isNaN(val) || val < 0) {
    showNotification(`${element.labels[0].textContent.slice(0, -1)} cannot be negative`, 'error');
    return;
  }
  
  if (element.id === 'minEfficiency') {
    const maxVal = parseFloat(document.getElementById('maxEfficiency').value);
    if (val >= maxVal) {
      chrome.storage.sync.set({ [element.id]: val }, () => {
        showNotification('Saved but Minimum Efficiency is greater than or equal to Maximum Efficiency', 'warning');
      });
      return;
    }
  } else {
    const minVal = parseFloat(document.getElementById('minEfficiency').value);
    if (val <= minVal) {
      chrome.storage.sync.set({ [element.id]: val }, () => {
        showNotification('Saved but Maximum Efficiency is less than or equal to Minimum Efficiency', 'warning');
      });
    return;
  }
  }
  
  chrome.storage.sync.set({ [element.id]: val }, () => {
    showNotification('Saved!', 'success');
  });
}

function handleMaxVariantsChange(event) {
  const element = event.target;
  const val = parseInt(element.value);
  if (isNaN(val) || val < 1) {
    showNotification(`${element.labels[0].textContent.slice(0, -1)} must be at least 1`, 'error');
    return;
  }
  chrome.storage.sync.set({ [element.id]: val }, () => {
    showNotification('Saved!', 'success');
  });
}

function handleCheckboxChange(event) {
  const element = event.target;
  const isChecked = element.checked;
  console.log(`${element.id} set to ${isChecked}`);
  chrome.storage.sync.set({ [element.id]: isChecked }, () => {
    console.log(`${element.id} saved as ${isChecked}`);
    showNotification('Saved!', 'success');
  });
}

function populateVariantsTable(wantedVariants, excludedVariants, listedVariants) {
  // Combine all variants into a single list with their types
  const allVariants = new Map();
  
  // Add wanted variants
  wantedVariants.forEach(v => {
    allVariants.set(v, { filter: v, type: 'wanted' });
  });
  
  // Add excluded variants
  excludedVariants.forEach(v => {
    allVariants.set(v, { filter: v, type: 'excluded' });
  });
  
  // Add listed variants
  listedVariants.forEach(v => {
    if (!allVariants.has(v)) {
      allVariants.set(v, { filter: v, type: 'listed' });
    }
  });
  
  // Convert to array and sort
  const variantsArray = Array.from(allVariants.values());
  sortVariants(variantsArray);
  
  // Populate table
  const tbody = document.getElementById('variantsTableBody');
  tbody.innerHTML = '';
  
  variantsArray.forEach(variant => {
    const row = createVariantRow(variant.filter, variant.type);
    tbody.appendChild(row);
  });
}

function createVariantRow(filter, type) {
  const row = document.createElement('tr');
  row.dataset.filter = filter;
  
  // Filter cell
  const filterCell = document.createElement('td');
  filterCell.className = 'variant-filter-cell';
  filterCell.textContent = filter;
  
  const deleteCell = document.createElement('td');
  deleteCell.className = 'checkbox-cell';
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = '✕';
  deleteBtn.onclick = () => deleteVariant(filter);
  deleteCell.appendChild(deleteBtn);
  
  // Wanted checkbox cell
  const wantedCell = document.createElement('td');
  wantedCell.className = 'checkbox-cell';
  const wantedCheckbox = document.createElement('input');
  wantedCheckbox.type = 'checkbox';
  if (type === 'wanted') {
    wantedCheckbox.checked = true;
    row.style.backgroundColor = 'lightgreen';
  }
  wantedCheckbox.onchange = (e) => handleVariantCheckboxChange(filter, 'wanted', e.target.checked);
  wantedCell.appendChild(wantedCheckbox);
  
  // Excluded checkbox cell
  const excludedCell = document.createElement('td');
  excludedCell.className = 'checkbox-cell';
  const excludedCheckbox = document.createElement('input');
  excludedCheckbox.type = 'checkbox';
  if (type === 'excluded') {
    excludedCheckbox.checked = true;
    row.style.backgroundColor = '#ffa7a7ff';
  }
  excludedCheckbox.onchange = (e) => handleVariantCheckboxChange(filter, 'excluded', e.target.checked);
  excludedCell.appendChild(excludedCheckbox);
  
  row.appendChild(filterCell);
  row.appendChild(wantedCell);
  row.appendChild(excludedCell);
  row.appendChild(deleteCell);
  
  return row;
}

function handleVariantCheckboxChange(filter, checkboxType, isChecked) {
  const row = document.querySelector(`tr[data-filter="${CSS.escape(filter)}"]`);
  const wantedCheckbox = row.querySelector('td:nth-child(2) input');
  const excludedCheckbox = row.querySelector('td:nth-child(3) input');
  
  if (isChecked) {
    // Uncheck the other checkbox (they're exclusive)
    if (checkboxType === 'wanted') {
      excludedCheckbox.checked = false;
      row.style.backgroundColor = 'lightgreen';
    } else {
      wantedCheckbox.checked = false;
      row.style.backgroundColor = '#ffa7a7ff';
    }
  }
  else row.style.backgroundColor = '';
  
  // Save changes
  saveVariantsFromTable();
}

function deleteVariant(filter) {
  const row = document.querySelector(`tr[data-filter="${CSS.escape(filter)}"]`);
  if (row) {
    row.remove();
    saveVariantsFromTable();
  }
}

function addNewVariant() {
  const input = document.getElementById('newVariantFilter');
  const filter = input.value.trim();
  
  if (!filter) {
    showNotification('Please enter a variant filter', 'error');
    return;
  }
  
  // Check if already exists
  const existing = document.querySelector(`tr[data-filter="${CSS.escape(filter)}"]`);
  if (existing) {
    showNotification('This variant filter already exists', 'error');
    return;
  }
  
  // Add to table as "listed" variant (no checkboxes checked)
  const tbody = document.getElementById('variantsTableBody');
  const row = createVariantRow(filter, 'listed');
  tbody.appendChild(row);
  
  // Clear input
  input.value = '';
  
  // Re-sort table
  const variants = getCurrentVariantsFromTable();
  sortVariants(variants);
  
  tbody.innerHTML = '';
  variants.forEach(variant => {
    const newRow = createVariantRow(variant.filter, variant.type);
    tbody.appendChild(newRow);
  });
  
  // Save
  saveVariantsFromTable();
}

function getCurrentVariantsFromTable() {
  const rows = document.querySelectorAll('#variantsTableBody tr');
  const variants = [];
  
  rows.forEach(row => {
    const filter = row.dataset.filter;
    const wantedChecked = row.querySelector('td:nth-child(2) input').checked;
    const excludedChecked = row.querySelector('td:nth-child(3) input').checked;
    
    let type = 'listed';
    if (wantedChecked) type = 'wanted';
    else if (excludedChecked) type = 'excluded';
    
    variants.push({ filter, type });
  });
  
  return variants;
}

function saveVariantsFromTable() {
  const variants = getCurrentVariantsFromTable();
  
  const wantedVariants = variants.filter(v => v.type === 'wanted').map(v => v.filter);
  const excludedVariants = variants.filter(v => v.type === 'excluded').map(v => v.filter);
  const listedVariants = variants.filter(v => v.type === 'listed').map(v => v.filter);
  
  chrome.storage.sync.get({
    minEfficiency: 0,
    maxEfficiency: 1.4,
    maxVariants: 15,
    randomizeVariants: false,
    autoUpdate: true,
    hideButtons: false
  }, (items) => {
    chrome.storage.sync.set({
      ...items,
      wantedVariants,
      excludedVariants,
      listedVariants
    });
  });

  showNotification("Saved!", 'success');
}

function setupTableSorting() {
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const column = th.dataset.column;
      
      // Toggle direction if same column, otherwise default to asc
      if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        sortDirection = 'asc';
      }
      
      // Update UI
      document.querySelectorAll('th.sortable').forEach(h => {
        h.classList.remove('sorted-asc', 'sorted-desc');
      });
      th.classList.add(sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
      
      // Re-sort and repopulate
      const variants = getCurrentVariantsFromTable();
      sortVariants(variants);
      
      const tbody = document.getElementById('variantsTableBody');
      tbody.innerHTML = '';
      variants.forEach(variant => {
        const row = createVariantRow(variant.filter, variant.type);
        tbody.appendChild(row);
      });
    });
  });
}

function sortVariants(variants) {
  variants.sort((a, b) => {
    let aVal, bVal;
    
    if (sortColumn === 'filter') {
      aVal = a.filter.toLowerCase();
      bVal = b.filter.toLowerCase();
    } else if (sortColumn === 'wanted') {
      aVal = a.type === 'wanted' ? 1 : 0;
      bVal = b.type === 'wanted' ? 1 : 0;
    } else if (sortColumn === 'excluded') {
      aVal = a.type === 'excluded' ? 1 : 0;
      bVal = b.type === 'excluded' ? 1 : 0;
    }
    
    if (sortDirection === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.className = `notification ${type}`;
  
  setTimeout(() => {
    notification.animate([
      { transform: 'translateY(0)', opacity: 1 },
      { transform: 'translateY(-50px)', opacity: 0 }
    ], {
      duration: 1000,
      easing: 'ease-out'
    });
  }, type === 'success' ? 500 : 1500);
  setTimeout(() => {
    notification.remove();
  }, type === 'success' ? 1450 : 2450);

  document.body.appendChild(notification);
}