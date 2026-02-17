// converter.js - static-friendly, CORS-safe, fallback + cache
const TTL = 10 * 60 * 1000;
const primaryUrl = (f,t) => `https://api.exchangerate.host/convert?from=${f}&to=${t}&amount=1`;
const fallbacks = [
  (f,t) => `https://api.frankfurter.app/latest?from=${f}&to=${t}`,
  (f,t) => `https://open.er-api.com/v6/latest/${f}`
];

function cacheKey(f,t){ return `sr_${f}_${t}`; }
function readCache(f,t){
  try{ const r = localStorage.getItem(cacheKey(f,t)); if(!r) return null; return JSON.parse(r); }catch(e){ return null; }
}
function writeCache(f,t,rate){ try{ localStorage.setItem(cacheKey(f,t), JSON.stringify({rate,ts:Date.now()})); }catch(e){} }

async function fetchWithRetries(url, attempts=2, delay=300){
  for(let i=0;i<=attempts;i++){
    try{
      const res = await fetch(url);
      if(!res.ok) throw new Error('http '+res.status);
      return await res.json();
    }catch(e){
      if(i===attempts) throw e;
      await new Promise(r=>setTimeout(r, delay * Math.pow(2,i)));
    }
  }
}

function setStatus(text, cls){
  const el = document.getElementById('rate-status');
  if(!el) return;
  el.textContent = text;
  el.dataset.state = cls || '';
}

function showRateInfo(text){
  const info = document.getElementById('rate-info');
  if(info) info.textContent = text;
}

async function getRateRobust(from, to){
  const cached = readCache(from,to);
  if(cached && (Date.now() - cached.ts) < TTL){
    setStatus('Using cached rate', 'cached');
    return {rate: cached.rate, source:'cache', ts: cached.ts};
  }

  const apis = [primaryUrl, ...fallbacks];
  let lastErr = null;
  for(let fn of apis){
    const url = fn(from,to);
    try{
      const data = await fetchWithRetries(url, 2, 300);
      // normalize
      let rate = null;
      if(data && typeof data === 'object'){
        if(typeof data.result === 'number') rate = data.result; // exchangerate.host
        else if(data.rates && data.rates[to]) rate = Number(data.rates[to]);
        else if(data.rates && Object.values(data.rates)[0]) rate = Number(Object.values(data.rates)[0]);
      }
      if(rate && !isNaN(rate)){
        writeCache(from,to,rate);
        setStatus('Live', 'live');
        return {rate, source:'api'};
      }
    }catch(e){ lastErr = e; /* try next */ }
  }

  if(cached){
    setStatus('Using stale cached rate', 'stale');
    return {rate: cached.rate, source:'stale', ts: cached.ts};
  }
  setStatus('Offline - unable to fetch', 'offline');
  throw new Error('no-rate');
}

function wireConverter(){
  const form = document.getElementById('converter-form');
  if(!form) return;
  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const from = (document.getElementById('from-currency').value || 'USD').toUpperCase();
    const to = (document.getElementById('to-currency').value || 'NGN').toUpperCase();
    const amt = parseFloat(document.getElementById('amount').value) || 1;
    setStatus('Checking...', 'loading');
    try{
      const res = await getRateRobust(from,to);
      const value = (res.rate * amt);
      document.getElementById('converted-value').textContent = value.toFixed(6);
      showRateInfo(`1 ${from} = ${res.rate} ${to}${res.ts ? ' (cached at '+new Date(res.ts).toLocaleString()+')' : ''}`);
    }catch(e){
      document.getElementById('converted-value').textContent = '--';
      showRateInfo('');
    }
  });
}

// calculators (simple functions)
function calculateSalary(){
  const salary = parseFloat(document.getElementById('annualSalary').value)||0;
  const hours = parseFloat(document.getElementById('hoursPerWeek').value)||40;
  const weeks = parseFloat(document.getElementById('weeksPerYear').value)||52;
  if(!salary || !hours){ document.getElementById('salaryResult').textContent='Enter valid numbers'; return; }
  const hourly = salary / (weeks * hours);
  document.getElementById('salaryResult').textContent = `Hourly: ${hourly.toFixed(2)}`;
}
function calculateVAT(){
  const amt = parseFloat(document.getElementById('vatAmount').value)||0;
  const rate = parseFloat(document.getElementById('vatRate').value)||0;
  if(!amt){ document.getElementById('vatResult').textContent='Enter amount'; return; }
  const vat = amt * (rate/100);
  document.getElementById('vatResult').textContent = `VAT: ${vat.toFixed(2)} • Total: ${(amt+vat).toFixed(2)}`;
}
function calculateLoan(){
  const amount = parseFloat(document.getElementById('loanAmount').value)||0;
  const rate = parseFloat(document.getElementById('interestRate').value)||0;
  const years = parseFloat(document.getElementById('loanYears').value)||0;
  if(!amount){ document.getElementById('loanResult').textContent='Enter loan amount'; return; }
  const total = amount * (1 + (rate/100) * years);
  document.getElementById('loanResult').textContent = `Total (simple): ${total.toFixed(2)}`;
}

document.addEventListener('DOMContentLoaded', ()=>{
  wireConverter();
  // expose calculator functions for inline onclick if needed
  window.calculateSalary = calculateSalary;
  window.calculateVAT = calculateVAT;
  window.calculateLoan = calculateLoan;
});
