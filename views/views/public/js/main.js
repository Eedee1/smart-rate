// public/js/main.js (merge with existing file - only add the populateCurrencies function & call)
async function populateCurrencies() {
  const fromSel = document.getElementById('from');
  const toSel = document.getElementById('to');
  if (!fromSel || !toSel) return;

  try {
    const resp = await fetch('/api/currencies');
    const data = await resp.json();
    if (!data || !data.currencies) throw new Error('No currencies returned');
    // clear existing
    fromSel.innerHTML = '';
    toSel.innerHTML = '';

    // Add optgroup: popular first
    const popular = ['USD','EUR','GBP','NGN','JPY','AUD','CAD','CNY'];
    const addOption = (sel, cur) => {
      const opt = document.createElement('option');
      opt.value = cur.code;
      opt.textContent = `${cur.code} — ${cur.name}`;
      sel.appendChild(opt);
    };

    // Add popular first (if present)
    popular.forEach(code => {
      const found = data.currencies.find(c => c.code === code);
      if (found) { addOption(fromSel, found); addOption(toSel, found); }
    });

    // Then add the rest sorted alphabetically
    const rest = data.currencies
      .filter(c => !popular.includes(c.code))
      .sort((a,b) => a.code.localeCompare(b.code));
    rest.forEach(c => { addOption(fromSel, c); addOption(toSel, c); });

    // set sensible defaults
    fromSel.value = 'USD';
    toSel.value = 'NGN';
  } catch (err) {
    console.error('Could not load currencies', err);
    // fallback: keep the previous small hard-coded list to avoid breaking the UI
    const fallback = ['USD','EUR','GBP','NGN','JPY'];
    fallback.forEach(code => {
      const opt1 = document.createElement('option'); opt1.value = code; opt1.textContent = code; fromSel.appendChild(opt1);
      const opt2 = document.createElement('option'); opt2.value = code; opt2.textContent = code; toSel.appendChild(opt2);
    });
    fromSel.value = 'USD';
    toSel.value = 'NGN';
  }
}

// call populate on load (only runs on pages that have the selects)
document.addEventListener('DOMContentLoaded', () => {
  populateCurrencies();

  // existing code: nav toggle, calculator wiring...
  // (rest of your main.js existing content should remain — keep it after this)
});
