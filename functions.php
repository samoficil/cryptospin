<?php
session_start();

$db = new PDO('sqlite:db.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Crear tablas si no existen
$db->exec("CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  balance REAL DEFAULT 0
)");

$db->exec("CREATE TABLE IF NOT EXISTS participations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  room INTEGER,
  number INTEGER,
  paid INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");

// Función para registrar usuario
function registerUser($username, $password) {
  global $db;
  $hash = password_hash($password, PASSWORD_DEFAULT);
  $stmt = $db->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
  return $stmt->execute([$username, $hash]);
}

// Función para login usuario
function loginUser($username, $password) {
  global $db;
  $stmt = $db->prepare("SELECT * FROM users WHERE username = ?");
  $stmt->execute([$username]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);
  if ($user && password_verify($password, $user['password'])) {
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    return true;
  }
  return false;
}

// Función para checar si está logueado
function isLoggedIn() {
  return isset($_SESSION['user_id']);
}

// Función para obtener usuario actual
function currentUser() {
  global $db;
  if (!isLoggedIn()) return null;
  $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
  $stmt->execute([$_SESSION['user_id']]);
  return $stmt->fetch(PDO::FETCH_ASSOC);
}

// Guardar participación después de pago exitoso
function addParticipation($user_id, $room, $number) {
  global $db;
  $stmt = $db->prepare("INSERT INTO participations (user_id, room, number, paid) VALUES (?, ?, ?, 1)");
  return $stmt->execute([$user_id, $room, $number]);
}

// Obtener saldo usuario
function getBalance($user_id) {
  global $db;
  $stmt = $db->prepare("SELECT balance FROM users WHERE id = ?");
  $stmt->execute([$user_id]);
  return $stmt->fetchColumn();
}

// Actualizar saldo usuario (ej: para agregar ganancias o restar retiros)
function updateBalance($user_id, $new_balance) {
  global $db;
  $stmt = $db->prepare("UPDATE users SET balance = ? WHERE id = ?");
  return $stmt->execute([$new_balance, $user_id]);
}
?>
