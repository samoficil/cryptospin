const roomsContainer = document.getElementById("rooms");
const YOUR_WALLET = "0x659a0f0D27378c9f25B97B0fE0F0df6fD1a6D3d4";
const USD_AMOUNT = 0.50; // Monto fijo en USD

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

// Para guardar el último precio válido
let cachedBNBPrice = null;
let lastPriceFetch = 0;

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
  if (cachedBNBPrice && now - lastPriceFetch < 15000) {
    return cachedBNBPrice;
  }
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
  for (let i = 1; i <= 10; i++) {
    createRoom(i);
  }
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
  const roomEl = document.querySelector(`.room[data-id='${roomId}']`);
  const countEl = roomEl.querySelector(".participant-count");
  const selectEl = roomEl.querySelector("select");
  const selectedNumber = selectEl.value;
  const joinBtn = roomEl.querySelector("button");
  const priceSpan = roomEl.querySelector("strong > span");

  if (!selectedNumber) {
    alert("Por favor selecciona un número antes de unirte.");
    return;
  }

  if (!window.ethereum) {
    alert("Por favor instala MetaMask u otra wallet compatible con Binance Smart Chain para pagar.");
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
    const from = accounts[0];
    const bnbAmount = priceSpan.dataset.bnbAmount;

    joinBtn.textContent = "Enviando transacción...";

    const txParams = {
      from,
      to: YOUR_WALLET,
      value: '0x' + (Math.floor(bnbAmount * 1e18)).toString(16)
    };

    await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [txParams],
    });

    let currentCount = parseInt(countEl.textContent);
    currentCount++;
    countEl.textContent = currentCount;

    alert(`¡Te uniste a la Sala #${roomId} con el número ${selectedNumber} exitosamente!`);

    const optionToDisable = selectEl.querySelector(`option[value="${selectedNumber}"]`);
    if(optionToDisable) optionToDisable.disabled = true;
    selectEl.value = "";

    joinBtn.disabled = true;
    joinBtn.textContent = "Unirse por $0.50";

  } catch (error) {
    alert("Error enviando transacción: " + error.message);
    joinBtn.disabled = false;
    joinBtn.textContent = "Unirse por $0.50";
  }
}

populateRooms();

const showProfileBtn = document.getElementById("showProfileBtn");
const userProfile = document.getElementById("userProfile");
const totalEarningsSpan = document.getElementById("totalEarnings");
const withdrawBtn = document.getElementById("withdrawBtn");
const withdrawStatus = document.getElementById("withdrawStatus");

let userEarnings = 0; // Actualiza con tus ganancias reales

showProfileBtn.onclick = () => userProfile.classList.toggle("hidden");

withdrawBtn.onclick = () => {
  if (userEarnings <= 0) return alert("No tienes ganancias para retirar.");
  withdrawStatus.textContent = "Procesando retiro...";
  // Aquí va la lógica real de retiro (contrato o backend)
  userEarnings = 0;
  totalEarningsSpan.textContent = "0.00 BNB";
  withdrawStatus.textContent = "Retiro completado.";
};
