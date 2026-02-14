// script.js — converter + calculators (robust + caching + fallbacks)

// ---------- Utilities & Caching ----------
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const FALLBACKS = [
  (f,t)=> `https://api.exchangerate.host/convert?from=${f}&to=${t}&amount=1`,
  (f,t)=> `https://api.frankfurter.app/latest?from=${f}&to=${t}`,
  (f,t)=> `https://open.er-api.com/v6/latest/${f}`
];

function cacheKey(from,to){ return `sr_rate_${from}_${to}`; }
function readCache(from,to){
  try { const raw = localStorage.getItem(cacheKey(from,to)); if(!raw) return null; const obj=JSON.parse(raw); return obj; } catch(e){return null;}
}
function writeCache(from,to,rateObj){ try{ localStorage.setItem(cacheKey(from,to), JSON.stringify(rateObj)); }catch(e){} }

// fetch with simple retries + backoff
async function fetchWithRetries(url, attempts=2, delay=400){
  for(let i=0;i<attempts;i++){
    try {
      const res = await fetch(url);
      if(!res.ok) throw new Error('http '+res.status);
      return await res.json();
    } catch(err){
      if(i===attempts-1) throw err;
      await new Promise(r=>setTimeout(r, delay * Math.pow(2,i)));
    }
  }
}

// parse responses from known fallbacks
function parseResponse(i,json,to){
  if(i===0 && json && typeof json.result !== 'undefined'){ // exchangerate.host
    const rate = json.info && json.info.rate ? json.info.rate : json.result;
    return { rate, raw: json };
  }
  if(i===1 && json && json.rates && json.rates[to]){ // frankfurter
    return { rate: json.rates[to], raw: json };
  }
  if(i===2 && json && json.rates && json.rates[to]){ // er-api
    return { rate: json.rates[to], raw: json };
  }
  return null;
}

async function getRateRobust(from,to){
  // serve fresh cache if valid
  const cached = readCache(from,to);
  if(cached && (Date.now() - cached.t) < CACHE_TTL){
    return { source:'cache', rate: cached.rate, t: cached.t, raw: cached.raw };
  }

  // try APIs
  for(let i=0;i<FALLBACKS.length;i++){
    const url = FALLBACKS[i](from,to);
    try {
      const json = await fetchWithRetries(url,2,300);
      const parsed = parseResponse(i,json,to);
      if(parsed && parsed.rate){
        const obj = { rate: parsed.rate, raw: parsed.raw, t: Date.now() };
        writeCache(from,to,obj);
        return { source:`api${i}`, rate: parsed.rate, t: obj.t, raw: obj.raw };
      }
    } catch(e){
      console.warn('api fallback failed', i, e);
      // continue to next
    }
  }

  // fallback to stale cache if exists
  if(cached) return { source:'stale', rate: cached.rate, t: cached.t, raw: cached.raw };

  // final failure
  return null;
}

// ---------- Converter UI wiring ----------
const convAmount = document.getElementById('amount');
const convFrom = document.getElementById('fromCurrency');
const convTo = document.getElementById('toCurrency');
const convBtn = document.getElementById('convertBtn');
const resultEl = document.getElementById('result');
const rateInfoEl = document.getElementById('rateInfo');
const apiStatusEl = document.getElementById('apiStatus');
const errorEl = document.getElementById('errorMsg');

function setStatus(state, text){
  if(!apiStatusEl) return;
  apiStatusEl.textContent = text || state;
  apiStatusEl.style.color = state==='live' ? 'green' : state==='cached' ? 'orange' : 'red';
}

async function doConvert(){
  if(!convAmount || !convFrom || !convTo) return;
  const amount = parseFloat(convAmount.value) || 0;
  const from = convFrom.value;
  const to = convTo.value;
  resultEl.textContent = 'Converting…';
  rateInfoEl.textContent = '';
  errorEl.textContent = '';
  setStatus('loading', 'checking...');
  try {
    const res = await getRateRobust(from,to);
    if(!res){
      setStatus('offline','offline');
      resultEl.textContent = '';
      errorEl.textContent = 'Unable to fetch live rate. Please try again.';
      return;
    }
    const converted = (res.rate * amount);
    resultEl.textContent = `${amount} ${from} = ${converted.toLocaleString(undefined,{maximumFractionDigits:6})} ${to}`;
    const dt = new Date(res.t);
    rateInfoEl.textContent = `Rate: 1 ${from} = ${res.rate} ${to} (source: ${res.source}; ${dt.toLocaleString()})`;
    if(res.source==='cache' || res.source==='stale') setStatus('cached','using cached rate');
    else setStatus('live','live rate');
  } catch(err){
    setStatus('offline','offline');
    resultEl.textContent = '';
    errorEl.textContent = 'Unable to fetch live rate. Please try again.';
    console.error(err);
  }
}
if(convBtn) convBtn.addEventListener('click', doConvert);
if(convAmount) convAmount.addEventListener('keydown', e=>{ if(e.key==='Enter') doConvert(); });

// ---------- Calculators ----------
function calculateSalary(){
  const salary = parseFloat(document.getElementById('annualSalary')?.value) || 0;
  const hours = parseFloat(document.getElementById('hoursPerWeek')?.value) || 40;
  const weeks = parseFloat(document.getElementById('weeksPerYear')?.value) || 52;
  if(salary<=0 || hours<=0){ document.getElementById('salaryResult').innerText = 'Enter valid salary and hours.'; return; }
  const hourly = salary / (weeks * hours);
  document.getElementById('salaryResult').innerText = `Hourly Rate: ${hourly.toFixed(2)}`;
}

function calculateLoan(){
  const amount = parseFloat(document.getElementById('loanAmount')?.value) || 0;
  const rate = (parseFloat(document.getElementById('interestRate')?.value) || 0) / 100;
  const years = parseFloat(document.getElementById('loanYears')?.value) || 1;
  if(amount<=0){ document.getElementById('loanResult').innerText='Enter loan amount.'; return; }
  // simple interest total
  const totalSimple = amount * (1 + rate * years);
  document.getElementById('loanResult').innerText = `Total payable (simple): ${totalSimple.toFixed(2)}`;
}

function calculateVAT(){
  const amt = parseFloat(document.getElementById('vatAmount')?.value) || 0;
  const rate = (parseFloat(document.getElementById('vatRate')?.value) || 0) / 100;
  const total = amt * (1 + rate);
  document.getElementById('vatResult').innerText = `Total (incl. VAT): ${total.toFixed(2)} (VAT: ${(amt*rate).toFixed(2)})`;
}

function calculateInflation(){
  const amt = parseFloat(document.getElementById('initialAmount')?.value) || 0;
  const rate = (parseFloat(document.getElementById('inflationRate')?.value) || 0) / 100;
  const years = parseFloat(document.getElementById('yearsInflation')?.value) || 0;
  const future = amt * Math.pow((1+rate), years);
  document.getElementById('inflationResult').innerText = `Future value: ${future.toFixed(2)}`;
}

function calculateMarkup(){
  const cost = parseFloat(document.getElementById('cost')?.value) || 0;
  const markup = (parseFloat(document.getElementById('markup')?.value) || 0) / 100;
  const price = cost * (1 + markup);
  document.getElementById('markupResult').innerText = `Selling price: ${price.toFixed(2)}`;
}

function calculateProfitMargin(){
  const revenue = parseFloat(document.getElementById('revenue')?.value) || 0;
  const cost = parseFloat(document.getElementById('costMargin')?.value) || 0;
  if(revenue<=0){ document.getElementById('profitResult').innerText='Enter revenue > 0'; return; }
  const margin = ((revenue - cost) / revenue) * 100;
  document.getElementById('profitResult').innerText = `Profit margin: ${margin.toFixed(2)}%`;
}
