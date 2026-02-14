/* script.js — calculators + converter helpers + kebab menu
   Defensive (checks for missing DOM elements) so pages can be swapped without breaking. */

// ------ Kebab menu ----------
(function(){
  const kebabBtn = document.querySelector('.kebab');
  const kebabMenu = document.querySelector('.kebab-menu');
  if(kebabBtn && kebabMenu){
    kebabBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      kebabMenu.classList.toggle('show');
    });
    document.addEventListener('click', ()=>{ kebabMenu.classList.remove('show'); });
  }
})();

// ------ Utility helpers -------
function safeGet(id){ return document.getElementById(id) || null; }
function showText(el, txt){ if(!el) return; el.textContent = txt; }

// ------ Salary to hourly -------
function calculateSalary(){
  const annual = parseFloat(safeGet('annualSalary')?.value) || 0;
  const hours = parseFloat(safeGet('hoursPerWeek')?.value) || 40;
  const weeks = parseFloat(safeGet('weeksPerYear')?.value) || 52;
  const out = safeGet('salaryResult');
  if(annual <= 0 || hours <= 0){ showText(out, 'Enter valid salary and hours per week.'); return; }
  const hourly = annual / (weeks * hours);
  showText(out, `Hourly Rate: ${hourly.toFixed(2)}`);
}

// ------ Loan (simple + monthly amortization) -------
function calculateLoan(){
  const amount = parseFloat(safeGet('loanAmount')?.value) || 0;
  const rate = parseFloat(safeGet('interestRate')?.value) || 0; // annual %
  const years = parseFloat(safeGet('loanYears')?.value) || 1;
  const out = safeGet('loanResult');
  if(amount <= 0){ showText(out, 'Enter loan amount.'); return; }
  // Simple total (for information)
  const totalSimple = amount * (1 + (rate/100) * years);
  // Monthly amortization using standard formula
  const monthlyRate = (rate/100)/12;
  const months = Math.round(years*12);
  let monthlyPayment = null;
  if(monthlyRate === 0) monthlyPayment = amount / months;
  else monthlyPayment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  showText(out, `Total (simple): ${totalSimple.toFixed(2)} • Monthly payment: ${monthlyPayment.toFixed(2)} (${months} months)`);
}

// ------ VAT -------
function calculateVAT(){
  const amt = parseFloat(safeGet('vatAmount')?.value) || 0;
  const rate = parseFloat(safeGet('vatRate')?.value) || 0;
  const out = safeGet('vatResult');
  if(amt <= 0){ showText(out, 'Enter amount'); return; }
  const vat = amt * (rate/100);
  const total = amt + vat;
  showText(out, `VAT: ${vat.toFixed(2)} • Total incl. VAT: ${total.toFixed(2)}`);
}

// ------ Inflation -------
function calculateInflation(){
  const amt = parseFloat(safeGet('initialAmount')?.value) || 0;
  const rate = parseFloat(safeGet('inflationRate')?.value) || 0;
  const years = parseFloat(safeGet('yearsInflation')?.value) || 0;
  const out = safeGet('inflationResult');
  if(amt<=0){ showText(out,'Enter current amount'); return; }
  const future = amt * Math.pow(1 + rate/100, years);
  showText(out, `Future value (after ${years} yrs): ${future.toFixed(2)}`);
}

// ------ Markup -------
function calculateMarkup(){
  const cost = parseFloat(safeGet('cost')?.value) || 0;
  const markup = parseFloat(safeGet('markup')?.value) || 0;
  const out = safeGet('markupResult');
  if(cost<=0){ showText(out,'Enter cost'); return; }
  const price = cost * (1 + markup/100);
  showText(out, `Selling price: ${price.toFixed(2)}`);
}

// ------ Profit margin -------
function calculateProfitMargin(){
  const revenue = parseFloat(safeGet('revenue')?.value) || 0;
  const cost = parseFloat(safeGet('costMargin')?.value) || 0;
  const out = safeGet('profitResult');
  if(revenue<=0){ showText(out,'Enter revenue'); return; }
  const margin = ((revenue - cost) / revenue) * 100;
  showText(out, `Profit margin: ${margin.toFixed(2)}%`);
}

// Export to window so inline onclick works if used
window.calculateSalary = calculateSalary;
window.calculateLoan = calculateLoan;
window.calculateVAT = calculateVAT;
window.calculateInflation = calculateInflation;
window.calculateMarkup = calculateMarkup;
window.calculateProfitMargin = calculateProfitMargin;
