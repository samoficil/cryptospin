<?php
require 'functions.php';

if (!isLoggedIn()) {
  http_response_code(403);
  echo "No autorizado";
  exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['room']) || !isset($data['number'])) {
  http_response_code(400);
  echo "Datos inválidos";
  exit;
}

$room = intval($data['room']);
$num = intval($data['number']);
$user_id = $_SESSION['user_id'];

// Guardar participación como pagada
addParticipation($user_id, $room, $num);

echo "OK";
?>
