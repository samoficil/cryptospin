<?php
require 'functions.php';

if (!isLoggedIn()) {
  header("Location: login.php");
  exit;
}

$user = currentUser();
$balance = getBalance($user['id']);
?>

<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Panel de Usuario</title></head>
<body>
  <h2>Bienvenido <?=htmlspecialchars($user['username'])?></h2>
  <p>Saldo: $<?=number_format($balance, 2)?></p>

  <h3>Retirar ganancias</h3>
  <?php if ($balance >= 10): ?>
    <form method="post" action="withdraw.php">
      <label>Cuenta para retiro (ej: PayPal o wallet): <input name="account" required></label><br>
      <button type="submit">Solicitar retiro</button>
    </form>
  <?php else: ?>
    <p>Debes tener mínimo $10 para retirar.</p>
  <?php endif; ?>

  <p><a href="logout.php">Cerrar sesión</a></p>
</body>
</html>
