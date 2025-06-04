<?php
// functions.php - Funciones comunes para CryptoSpin

// Iniciar sesión
function startSession() {
    if (session_status() == PHP_SESSION_NONE) {
        session_start();
    }
}

// Conectar a la base de datos SQLite
function getDB() {
    try {
        $pdo = new PDO('sqlite:db.sqlite');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        die('Error de conexión: ' . $e->getMessage());
    }
}

// Crear tablas si no existen
function initializeDB() {
    $pdo = getDB();
    
    // Tabla usuarios
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            wallet_address VARCHAR(100),
            balance DECIMAL(10,6) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Tabla participaciones
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS participations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            room_id INTEGER NOT NULL,
            selected_number INTEGER NOT NULL,
            amount_bnb DECIMAL(10,6) NOT NULL,
            amount_usd DECIMAL(10,2) NOT NULL,
            tx_hash VARCHAR(100),
            status VARCHAR(20) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ");
    
    // Tabla salas
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            max_participants INTEGER DEFAULT 200,
            current_participants INTEGER DEFAULT 0,
            status VARCHAR(20) DEFAULT 'active',
            prize_1 DECIMAL(10,2) DEFAULT 10.00,
            prize_2 DECIMAL(10,2) DEFAULT 10.00,
            prize_3 DECIMAL(10,2) DEFAULT 50.00,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Tabla ganancias
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS winnings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            room_id INTEGER NOT NULL,
            prize_amount DECIMAL(10,6) NOT NULL,
            prize_type VARCHAR(20) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ");
    
    // Tabla retiros
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS withdrawals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount DECIMAL(10,6) NOT NULL,
            wallet_address VARCHAR(100) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            tx_hash VARCHAR(100),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ");
    
    // Insertar salas por defecto
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM rooms");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        for ($i = 1; $i <= 10; $i++) {
            $pdo->exec("INSERT INTO rooms (id, name) VALUES ($i, 'Sala #$i')");
        }
    }
}

// Verificar si el usuario está logueado
function isLoggedIn() {
    startSession();
    return isset($_SESSION['user_id']);
}

// Obtener datos del usuario actual
function getCurrentUser() {
    if (!isLoggedIn()) return null;
    
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// Registrar nuevo usuario
function registerUser($username, $email, $password, $wallet_address = '') {
    $pdo = getDB();
    
    // Verificar que no exista el usuario o email
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    if ($stmt->fetchColumn() > 0) {
        return ['success' => false, 'message' => 'Usuario o email ya existe'];
    }
    
    // Crear usuario
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password, wallet_address) VALUES (?, ?, ?, ?)");
    
    try {
        $stmt->execute([$username, $email, $hashedPassword, $wallet_address]);
        return ['success' => true, 'message' => 'Usuario registrado exitosamente'];
    } catch (PDOException $e) {
        return ['success' => false, 'message' => 'Error al registrar usuario'];
    }
}

// Iniciar sesión de usuario
function loginUser($username, $password) {
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($password, $user['password'])) {
        startSession();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        return ['success' => true, 'message' => 'Login exitoso'];
    }
    
    return ['success' => false, 'message' => 'Credenciales incorrectas'];
}

// Cerrar sesión
function logoutUser() {
    startSession();
    session_destroy();
}

// Registrar participación
function addParticipation($user_id, $room_id, $selected_number, $amount_bnb, $amount_usd, $tx_hash = '') {
    $pdo = getDB();
    
    // Verificar que el número no esté tomado en esa sala
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM participations WHERE room_id = ? AND selected_number = ? AND status != 'cancelled'");
    $stmt->execute([$room_id, $selected_number]);
    if ($stmt->fetchColumn() > 0) {
        return ['success' => false, 'message' => 'Número ya tomado'];
    }
    
    // Registrar participación
    $stmt = $pdo->prepare("
        INSERT INTO participations (user_id, room_id, selected_number, amount_bnb, amount_usd, tx_hash, status) 
        VALUES (?, ?, ?, ?, ?, ?, 'confirmed')
    ");
    
    try {
        $stmt->execute([$user_id, $room_id, $selected_number, $amount_bnb, $amount_usd, $tx_hash]);
        
        // Actualizar contador de participantes en la sala
        $stmt = $pdo->prepare("UPDATE rooms SET current_participants = current_participants + 1 WHERE id = ?");
        $stmt->execute([$room_id]);
        
        return ['success' => true, 'message' => 'Participación registrada'];
    } catch (PDOException $e) {
        return ['success' => false, 'message' => 'Error al registrar participación'];
    }
}

// Obtener números disponibles en una sala
function getAvailableNumbers($room_id) {
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT selected_number FROM participations WHERE room_id = ? AND status != 'cancelled'");
    $stmt->execute([$room_id]);
    $taken = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'selected_number');
    
    $available = [];
    for ($i = 1; $i <= 200; $i++) {
        if (!in_array($i, $taken)) {
            $available[] = $i;
        }
    }
    
    return $available;
}

// Obtener participaciones de un usuario
function getUserParticipations($user_id) {
    $pdo = getDB();
    $stmt = $pdo->prepare("
        SELECT p.*, r.name as room_name 
        FROM participations p 
        JOIN rooms r ON p.room_id = r.id 
        WHERE p.user_id = ? 
        ORDER BY p.created_at DESC
    ");
    $stmt->execute([$user_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Obtener ganancias de un usuario
function getUserWinnings($user_id) {
    $pdo = getDB();
    $stmt = $pdo->prepare("
        SELECT w.*, r.name as room_name 
        FROM winnings w 
        JOIN rooms r ON w.room_id = r.id 
        WHERE w.user_id = ? 
        ORDER BY w.created_at DESC
    ");
    $stmt->execute([$user_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Obtener balance total del usuario
function getUserBalance($user_id) {
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT SUM(prize_amount) as total FROM winnings WHERE user_id = ? AND status = 'confirmed'");
    $stmt->execute([$user_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return $result['total'] ?? 0;
}

// Obtener precio actual de BNB
function getBNBPrice() {
    $cache_file = 'bnb_price_cache.json';
    $cache_time = 60; // Cache por 1 minuto
    
    if (file_exists($cache_file) && (time() - filemtime($cache_file)) < $cache_time) {
        $data = json_decode(file_get_contents($cache_file), true);
        return $data['price'];
    }
    
    try {
        $response = file_get_contents('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
        $data = json_decode($response, true);
        $price = $data['binancecoin']['usd'];
        
        file_put_contents($cache_file, json_encode(['price' => $price, 'timestamp' => time()]));
        return $price;
    } catch (Exception $e) {
        return 600; // Precio por defecto si falla la API
    }
}

// Calcular cantidad de BNB para $0.50 USD
function calculateBNBAmount($usd_amount = 0.50) {
    $bnb_price = getBNBPrice();
    return $usd_amount / $bnb_price;
}

// Inicializar la base de datos al incluir este archivo
initializeDB();
?>
