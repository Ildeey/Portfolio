<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

ensureAdminUser();

$method = $_SERVER['REQUEST_METHOD'];
action:
$action = $_GET['action'] ?? '';

if ($method === 'GET' && $action === 'current') {
    $user = currentUser();
    jsonResponse(['user' => $user]);
}

if ($method === 'POST' && $action === 'register') {
    $data = parseJsonInput();
    $username = trim((string) ($data['username'] ?? ''));
    $email = trim((string) ($data['email'] ?? ''));
    $password = (string) ($data['password'] ?? '');
    $phone = trim((string) ($data['phone'] ?? ''));

    if ($username === '' || $email === '' || $password === '') {
        jsonResponse(['error' => 'Required fields are missing'], 400);
    }

    $pdo = getPDO();
    $exists = $pdo->prepare('SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1');
    $exists->execute([$username, $email]);

    if ($exists->fetch()) {
        jsonResponse(['error' => 'User already exists'], 409);
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (username, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$username, $email, $passwordHash, $phone, 'user']);

    $userId = (int) $pdo->lastInsertId();
    startSession();
    $_SESSION['user_id'] = $userId;

    jsonResponse(['user' => ['id' => $userId, 'username' => $username, 'email' => $email, 'phone' => $phone, 'role' => 'user']]);
}

if ($method === 'POST' && $action === 'login') {
    $data = parseJsonInput();
    $login = trim((string) ($data['login'] ?? ''));
    $password = (string) ($data['password'] ?? '');

    if ($login === '' || $password === '') {
        jsonResponse(['error' => 'Login and password required'], 400);
    }

    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT id, username, email, password_hash, phone, role FROM users WHERE username = ? OR email = ? LIMIT 1');
    $stmt->execute([$login, $login]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(['error' => 'Invalid credentials'], 401);
    }

    startSession();
    $_SESSION['user_id'] = (int) $user['id'];
    unset($user['password_hash']);

    jsonResponse(['user' => $user]);
}

if ($method === 'POST' && $action === 'logout') {
    startSession();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Not found'], 404);
