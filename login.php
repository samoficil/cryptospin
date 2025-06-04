<?php
require 'functions.php';

if (isLoggedIn()) {
  // Redirigir a pay.php si ya logueado y vienen datos de sala y número
  if (isset($_GET['room']) && isset($_GET['num'])) {
    header("Location: pay.php?room={$_GET['room']}&num={$_GET['num']}");
    exit;
  } else {
    header("Location: dashboard.php");
    exit;
  }
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $username = $_POST['username'] ?? '';
  $password = $_POST['password'] ?? '';
  if (loginUser($username, $password)) {
    // Login ok, redirigir
    if (isset($_GET['room']) && isset($_GET['num'])) {
      header("Location: pay.php?room={$_GET['room']}&num={$_GET['num']}");
    } else {
      header("Location: dashboard.php");
    }
    exit;
  } else {
    $error = 'Usuario o contraseña incorrectos';
  }
}
?>

<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Login</title></head>
<body>
<h2>Iniciar Sesión</h2>
<?php if ($error): ?>
<p style="color:red;"><?=htmlspecialchars($error)?></p>
<?php endif; ?>
<form method="post">
  <label>Usuario: <input name="username" required></label><br>
  <label>Contraseña: <input type="password" name="password" required></label><br>
  <button type="submit">Entrar</button>
</form>
<p>¿No tienes cuenta? <a href="register.php?room=<?=urlencode($_GET['room']??'')?>&num=<?=urlencode($_GET['num']??'')?>">Regístrate aquí</a></p>
</body>
</html>
