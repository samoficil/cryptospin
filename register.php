<?php
require 'functions.php';

if (isLoggedIn()) {
  header("Location: dashboard.php");
  exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $username = $_POST['username'] ?? '';
  $password = $_POST['password'] ?? '';
  $password2 = $_POST['password2'] ?? '';

  if ($password !== $password2) {
    $error = 'Las contraseñas no coinciden.';
  } else {
    try {
      if (registerUser($username, $password)) {
        // Registro ok, mandar a login
        header("Location: login.php?room={$_GET['room']}&num={$_GET['num']}");
        exit;
      } else {
        $error = 'Error al registrar usuario.';
      }
    } catch (Exception $e) {
      $error = 'Usuario ya existe.';
    }
  }
}
?>

<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Registro</title></head>
<body>
<h2>Registro</h2>
<?php if ($error): ?>
<p style="color:red;"><?=htmlspecialchars($error)?></p>
<?php endif; ?>
<form method="post">
  <label>Usuario: <input name="username" required></label><br>
  <label>Contraseña: <input type="password" name="password" required></label><br>
  <label>Repetir contraseña: <input type="password" name="password2" required></label><br>
  <button type="submit">Registrar</button>
</form>
<p>¿Ya tienes cuenta? <a href="login.php?room=<?=urlencode($_GET['room']??'')?>&num=<?=urlencode($_GET['num']??'')?>">Inicia sesión aquí</a></p>
</body>
</html>
