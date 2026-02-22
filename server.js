// server.js (update / merge into your existing file)
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CURRENCIES LIST (code + human name) ---
const currencies = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "INR", name: "Indian Rupee" },
  { code: "ZAR", name: "South African Rand" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "DKK", name: "Danish Krone" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "ARS", name: "Argentine Peso" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "ILS", name: "Israeli Shekel" },
  { code: "THB", name: "Thai Baht" },
  { code: "VND", name: "Vietnam Dong" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "BDT", name: "Bangladeshi Taka" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "NPR", name: "Nepalese Rupee" },
  { code: "LKR", name: "Sri Lanka Rupee" },
  { code: "BGN", name: "Bulgarian Lev" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "HUF", name: "Hungarian Forint" },
  { code: "RON", name: "Romanian Leu" },
  { code: "HRK", name: "Croatian Kuna" },
  { code: "ISK", name: "Iceland Krona" },
  { code: "UAH", name: "Ukrainian Hryvnia" },
  { code: "KWD", name: "Kuwaiti Dinar" },
  { code: "QAR", name: "Qatari Rial" },
  { code: "OMR", name: "Omani Rial" },
  { code: "JOD", name: "Jordanian Dinar" },
  { code: "TND", name: "Tunisian Dinar" },
  { code: "CLP", name: "Chilean Peso" },
  { code: "COP", name: "Colombian Peso" },
  { code: "PEN", name: "Peruvian Sol" }
];

// Views & static
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Simple cache & getRates from previous snippet (unchanged)
const CACHE_TTL = 60 * 60 * 1000;
const rateCache = {};

async function getRates(base = 'USD') {
  base = base.toUpperCase();
  const now = Date.now();
  if (rateCache[base] && (now - rateCache[base].timestamp) < CACHE_TTL) {
    return rateCache[base].rates;
  }
  const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}`;
  try {
    const resp = await axios.get(url, { timeout: 7000 });
    if (!resp.data || !resp.data.rates) throw new Error('Bad response from rate API');
    rateCache[base] = { timestamp: now, rates: resp.data.rates };
    return resp.data.rates;
  } catch (err) {
    if (rateCache[base]) return rateCache[base].rates;
    throw err;
  }
}

// Pages
app.get('/', (req, res) => res.render('index'));
app.get('/currency', (req, res) => res.render('currency'));
app.get('/salary', (req, res) => res.render('salary'));
app.get('/vat', (req, res) => res.render('vat'));
app.get('/loan', (req, res) => res.render('loan'));

// New endpoint: list of currencies
app.get('/api/currencies', (req, res) => {
  res.json({ success: true, currencies });
});

// API convert (unchanged)
app.get('/api/convert', async (req, res) => {
  const { from, to, amount } = req.query;
  if (!from || !to || !amount) {
    return res.status(400).json({ error: 'from, to and amount query parameters are required' });
  }

  try {
    const rates = await getRates(from);
    const rate = rates[to.toUpperCase()];
    if (!rate) {
      return res.status(400).json({ error: 'unsupported target currency' });
    }
    const numAmount = Number(amount);
    const converted = numAmount * rate;
    res.json({ success: true, rate, result: converted });
  } catch (err) {
    console.error('Rate fetch error:', err.message || err);
    res.status(502).json({ error: 'rate-fetch-failed', message: 'Could not fetch rates right now' });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
