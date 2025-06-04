<?php
require 'functions.php';

if (!isLoggedIn()) {
  header("Location: login.php?room={$_GET['room']}&num={$_GET['num']}");
  exit;
}

$user = currentUser();
$room = intval($_GET['room'] ?? 0);
$num = intval($_GET['num'] ?? 0);

if ($room < 1 || $num < 1 || $num > 200) {
  echo "Datos inválidos";
  exit;
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Pago para Sala <?=$room?> - Número <?=$num?></title>
  <script src="https://cdn.jsdelivr.net/npm/web3/dist/web3.min.js"></script>
</head>
<body>
  <h2>Hola <?=htmlspecialchars($user['username'])?></h2>
  <p>Vas a pagar <strong>$0.50</strong> en BNB para participar en la Sala #<?=$room?> con el número <?=$num?></p>
  <button id="payBtn">Pagar con MetaMask</button>
  <p id="msg"></p>

  <script>
    const YOUR_WALLET = "0x659a0f0D27378c9f25B97B0fE0F0df6fD1a6D3d4";
    const USD_AMOUNT = 0.50;

    async function fetchBNBPrice() {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
        const data = await res.json();
        return data.binancecoin.usd;
      } catch {
        return 300;
      }
    }

    async function pay() {
      if (!window.ethereum) {
        alert("Instala MetaMask para continuar.");
        return;
      }

      const bnbPrice = await fetchBNBPrice();
      const bnbAmount = (USD_AMOUNT / bnbPrice).toFixed(6);
      const value = '0x' + (Math.floor(bnbAmount * 1e18)).toString(16);

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
      } catch (error) {
        alert('Por favor agrega Binance Smart Chain en MetaMask y cámbiate a esa red.');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];

      try {
        await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from,
            to: YOUR_WALLET,
            value,
          }],
        });
        document.getElementById('msg').innerText = "Pago realizado con éxito!";

        // Notificar al backend del pago (usar fetch)
        await fetch('payment_confirm.php', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({room: <?=$room?>, number: <?=$num?>}),
          credentials: 'include'
        });

        setTimeout(() => {
          window.location.href = 'dashboard.php';
        }, 3000);
      } catch (e) {
        document.getElementById('msg').innerText = "Pago cancelado o fallido.";
      }
    }

    document.getElementById('payBtn').addEventListener('click', pay);
  </script>
</body>
</html>
