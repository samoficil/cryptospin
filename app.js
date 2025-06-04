const roomsContainer = document.getElementById("rooms");
const YOUR_WALLET = "0x659a0f0D27378c9f25B97B0fE0F0df6fD1a6D3d4";
const USD_AMOUNT = 0.50;

const extraInfoHTML = `
  <div class="ml-4 text-sm space-y-1 max-w-xs">
    <p class="font-bold text-green-400">GANA $50 CON $0,50</p>
    <p>3 ENTRE 200 | ¡Bienvenido! al Sorteo por Participacion en donde tendrás 3 Oportunidades para ¡GANAR!</p>
    <p class="font-semibold">>>SERÁN 3 GIROS<<</p>
    <p>GIRO1️⃣ $10</p>
    <p>GIRO2️⃣ $10</p>
    <p>GIRO3️⃣ $50 🏆</p>
    <p class="font-bold">¡QUE GANE EL MEJOR!</p>
  </div>
`;

// Guardar ganancias por usuario en localStorage (simple)
const EARNINGS_KEY = "cryptospin_earnings";

let cachedBNBPrice = null;
let lastPriceFetch = 0;
let userAccount = null;

function saveEarnings(account, amount) {
  let earnings = JSON.parse(localStorage.getItem(EARNINGS_KEY) || "{}");
  earnings[account] = (earnings[account] || 0) + amount;
  localStorage.setItem(EARNINGS_KEY, JSON.stringify(earnings));
}

function getEarnings(account) {
  let earnings = JSON.parse(localStorage.getItem(EARNINGS_KEY) || "{}");
  return earnings[account] || 0;
}

function createRoom(id) {
  const room = document.createElement("div");
  room.className = "bg-gray-700 rounded-xl p-4 shadow-xl room";
  room.setAttribute("data-id", id);
  room.setAttribute("data-participants", 0);

  const iframeId = `wheel-${id}`;
  const selectId = `numberSelect-${id}`;
  const buttonId = `joinBtn-${id}`;
  const priceSpanId = `priceSpan-${id}`;

  const availableNumbers = Array.from({ length: 200 }, (_, i) => i + 1);

  room.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-lg font-bold flex items-center gap-2">Sala #${id}</h3>
      ${extraInfoHTML}
    </div>
    <p>Participantes: <span class="participant-count">0</span> / 200</p>
    <label for="${selectId}" class="block mt-2 text-sm">Escoge tu número:</label>
    <select id="${selectId}" class="w-full p-2 text-black rounded mb-2">
      <option value="" selected disabled>-- Selecciona un número --</option>
      ${availableNumbers.map(n => `<option value="${n}">${n}</option>`).join("")}
    </select>
    <div class="mb-2">
      <span>Precio a pagar: <strong><span id="${priceSpanId}">Calculando...</span> BNB</strong></span>
    </div>
    <button id="${buttonId}" disabled
      class="bg-green-600 opacity-50 cursor-not-allowed hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full">
      Unirse por $0.50
    </button>
    <iframe
      id="${iframeId}"
      src="https://wheelofnames.com/bh2-bm6"
      width="400"
      height="400"
    ></iframe>
  `;

  roomsContainer.appendChild(room);

  const selectEl = document.getElementById(selectId);
  const joinBtn = document.getElementById(buttonId);
  const priceSpan = document.getElementById(priceSpanId);

  selectEl.addEventListener("change", () => {
    if (selectEl.value) {
      joinBtn.disabled = false;
      joinBtn.classList.remove("opacity-50", "cursor-not-allowed");
    } else {
      joinBtn.disabled = true;
      joinBtn.classList.add("opacity-50", "cursor-not-allowed");
    }
  });

  joinBtn.addEventListener("click", () => joinRoom(id));
  updatePrice(priceSpan);
}

async function fetchBNBPrice() {
  const now = Date.now();
  if (cachedBNBPrice && now - lastPriceFetch < 15000) return cachedBNBPrice;

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd'
    );
    if (!response.ok) throw new Error(`HTTP status ${response.status}`);
    const data = await response.json();
    cachedBNBPrice = data.binancecoin.usd;
    lastPriceFetch = now;
    return cachedBNBPrice;
  } catch (e) {
    console.warn('Error obteniendo precio BNB:', e);
    return cachedBNBPrice || 300;
  }
}

async function updatePrice(priceSpan) {
  const priceBNB = await fetchBNBPrice();
  const bnbAmount = (USD_AMOUNT / priceBNB).toFixed(6);
  priceSpan.textContent = bnbAmount;
  priceSpan.dataset.bnbAmount = bnbAmount;
}

async function populateRooms() {
  for (let i = 1; i <= 10; i++) createRoom(i);

  setInterval(() => {
    document.querySelectorAll(".room").forEach(room => {
      const priceSpan = room.querySelector("strong > span");
      updatePrice(priceSpan);
    });
  }, 60000);
}

async function switchToBSC() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x38' }],
    });
    return true;
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x38',
            chainName: 'Binance Smart Chain Mainnet',
            nativeCurrency: {
              name: 'Binance Coin',
              symbol: 'BNB',
              decimals: 18
            },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com']
          }]
        });
        return true;
      } catch (addError) {
        alert('Error agregando la red BSC: ' + addError.message);
        return false;
      }
    } else {
      alert('Error cambiando a la red BSC: ' + switchError.message);
      return false;
    }
  }
}

async function joinRoom(roomId) {
  if (!userAccount) {
    alert("Conéctate a MetaMask para participar.");
    await connectWallet();
    if (!userAccount) return;
  }

  const roomEl = document.querySelector(`.room[data-id='${roomId}']`);
  const countEl = roomEl.querySelector(".participant-count");
  const selectEl = roomEl.querySelector("select");
  const selectedNumber = selectEl.value;
  const joinBtn = roomEl.querySelector("button");
  const priceSpan = roomEl.querySelector("strong > span");

  if (!selectedNumber) {
    alert("Selecciona un número antes de unirte.");
    return;
  }

  if (!window.ethereum) {
    alert("Instala MetaMask o wallet compatible Binance Smart Chain.");
    return;
  }

  joinBtn.disabled = true;
  joinBtn.textContent = "Validando red BNB...";

  const isSwitched = await switchToBSC();
  if (!isSwitched) {
    joinBtn.disabled = false;
    joinBtn.textContent = "Unirse por $0.50";
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    userAccount = accounts[0];
    updateUserWalletUI();

    const from = userAccount;
    const bnbAmount = priceSpan.dataset.bnbAmount;

    joinBtn.textContent = "Enviando transacción...";

    const txParams = {
      from,
      to: YOUR_WALLET,
      value: "0x" + (parseFloat(bnbAmount) * 1e18).toString(16)
    };

    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [txParams]
    });

    // Guardar ganancias para el usuario
    saveEarnings(userAccount, USD_AMOUNT);

    const currentCount = parseInt(countEl.textContent);
    countEl.textContent = currentCount + 1;

    alert(`Pago recibido. ¡Buena suerte con el número ${selectedNumber}!`);

  } catch (error) {
    console.error(error);
    alert("Error al enviar el pago: " + (error.message || error));
  }

  joinBtn.disabled = false;
  joinBtn.textContent = "Unirse por $0.50";
}

// Perfil modal handlers
const profileModal = document.getElementById("profileModal");
const profileBtn = document.getElementById("profileBtn");
const closeProfileBtn = document.getElementById("closeProfileBtn");
const withdrawBtn = document.getElementById("withdrawBtn");
const userWalletSpan = document.getElementById("userWallet");
const userEarningsSpan = document.getElementById("userEarnings");

profileBtn.addEventListener("click", async () => {
  if (!userAccount) {
    await connectWallet();
  }
  if (!userAccount) return;
  updateUserWalletUI();
  updateUserEarningsUI();
  profileModal.classList.remove("hidden");
});

closeProfileBtn.addEventListener("click", () => {
  profileModal.classList.add("hidden");
});

withdrawBtn.addEventListener("click", async () => {
  const earnings = getEarnings(userAccount);
  if (earnings <= 0) {
    alert("No tienes ganancias para retirar.");
    return;
  }

  if (!window.ethereum) {
    alert("Instala MetaMask o wallet compatible.");
    return;
  }

  const isSwitched = await switchToBSC();
  if (!isSwitched) return;

  try {
    const amountBNB = (earnings / cachedBNBPrice).toFixed(6);
    const txParams = {
      from: YOUR_WALLET,
      to: userAccount,
      value: "0x0"
    };

    alert("Para retirar tus ganancias, contacta al administrador con la siguiente wallet:\n" + YOUR_WALLET +
      "\n\nActualmente la transferencia automática no está habilitada por limitaciones de seguridad.\n\n" +
      "Pero tus ganancias están registradas y puedes verificarlo aquí.");

  } catch (error) {
    alert("Error en retiro: " + error.message);
  }
});

async function connectWallet() {
  if (!window.ethereum) {
    alert("Instala MetaMask o wallet compatible Binance Smart Chain.");
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    userAccount = accounts[0];
    updateUserWalletUI();
  } catch (error) {
    console.error(error);
    alert("No se pudo conectar la wallet.");
  }
}

function updateUserWalletUI() {
  userWalletSpan.textContent = userAccount || "-";
}

function updateUserEarningsUI() {
  const earnings = getEarnings(userAccount);
  userEarningsSpan.textContent = earnings.toFixed(2);
}

window.addEventListener("load", () => {
  populateRooms();
});

// Al cargar la página, intenta conectar wallet (MetaMask)
window.onload = async () => {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      // Binance Smart Chain mainnet chainId = 0x38
      if (chainId !== '0x38') {
        alert('⚠️ Cambia a Binance Smart Chain (BNB) para pagar');
      }
    } catch (error) {
      console.log('Usuario no conectó wallet');
    }
  } else {
    alert('Por favor instala MetaMask');
  }
};

// Para pagos, solo acepta BNB (ejemplo)
async function pagarBNB(montoBNB, destino) {
  const accounts = await ethereum.request({ method: 'eth_accounts' });
  if (accounts.length === 0) return alert('Wallet no conectada');
  
  const tx = {
    from: accounts[0],
    to: destino,
    value: ethers.utils.parseEther(montoBNB).toHexString(),
    chainId: 56, // BSC mainnet
  };

  try {
    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [tx],
    });
    console.log('Pago exitoso:', txHash);
  } catch (error) {
    console.error('Pago fallido:', error);
  }
}
