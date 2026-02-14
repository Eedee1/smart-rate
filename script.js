async function convertCurrency() {

    const amount = document.getElementById("amount").value;
    const from = document.getElementById("fromCurrency").value;
    const to = document.getElementById("toCurrency").value;
    const result = document.getElementById("result");

    if (amount === "" || amount <= 0) {
        result.innerText = "Please enter a valid amount.";
        return;
    }

    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
        const data = await response.json();

        const rate = data.rates[to];
        const converted = (amount * rate).toFixed(2);

        result.innerText = `${amount} ${from} = ${converted} ${to}`;
    } catch (error) {
        result.innerText = "Unable to fetch live rate. Please try again.";
    }
}
