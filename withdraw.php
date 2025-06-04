<?php
require 'functions.php';

if (!isLoggedIn()) {
  header("Location: login.php");
  exit;
}

$user = currentUser();
$balance = getBalance($user['id']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if ($balance >= 10) {
    $account = trim($_POST['account'] ?? '');
    if ($account) {
      // Aquí deberías procesar el retiro manualmente o automatizado
      // Por ejemplo, restamos el saldo:
      updateBalance($user['id'], 0);
      echo "Solicitud de retiro enviada para la cuenta: " . htmlspecialchars($account);
      exit;
    }
  } else {
    echo "No tienes saldo suficiente para retirar.";
    exit;
  }
}

header("Location: dashboard.php");
exit;
?>
