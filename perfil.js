let userAccount = null;

const connectWalletBtn = document.getElementById("connectWalletBtn");
const userWalletSpan = document.getElementById("userWallet");
const userEarningsSpan = document.getElementById("userEarnings");
const withdrawBtn = document.getElementById("withdrawBtn");
const userInfoDiv = document.getElementById("userInfo");

const EARNINGS_KEY = "earnings";

function getEarnings(account) {
  if (!account) return 0;
  const data = localStorage.getItem(EARNINGS_KEY);
  if (!data) return 0;
  const earningsData = JSON.parse(data);
  return earningsData[account.toLowerCase()] || 0;
}

function updateUI() {
  if (!userAccount) {
    userWalletSpan.textContent = "-";
    userEarningsSpan.textContent = "0.00";
    userInfoDiv.style.display = "none";
    connectWalletBtn.style.display = "inline-block";
  } else {
    userWalletSpan.textContent = userAccount;
    userEarningsSpan.textContent = getEarnings(userAccount).toFixed(2);
    userInfoDiv.style.display = "block";
    connectWalletBtn.style.display = "none";
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    alert("Instala MetaMask o wallet compatible Binance Smart Chain.");
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    userAccount = accounts[0];
    updateUI();
  } catch (error) {
    alert("No se pudo conectar la wallet.");
  }
}

async function withdraw() {
  const earnings = getEarnings(userAccount);
  if (earnings <= 0) {
    alert("No tienes ganancias para retirar.");
    return;
  }
  alert(`Para retirar tus ganancias, contacta al administrador con la siguiente wallet:\n\n[Wallet Admin Oculta]\n\nTus ganancias están registradas y puedes verificarlo.`);
}

connectWalletBtn.addEventListener("click", connectWallet);
withdrawBtn.addEventListener("click", withdraw);

updateUI();
