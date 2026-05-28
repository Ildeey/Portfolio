<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user = requireAuth();
    $pdo = getPDO();

    if ($user['role'] === 'admin') {
        $stmt = $pdo->query('SELECT r.id, r.name, r.email, r.phone, r.message, r.created_at, u.username AS user_name FROM requests r LEFT JOIN users u ON u.id = r.user_id ORDER BY r.created_at DESC');
        $requests = $stmt->fetchAll();
    } else {
        $stmt = $pdo->prepare('SELECT id, name, email, phone, message, created_at FROM requests WHERE user_id = ? ORDER BY created_at DESC');
        $stmt->execute([$user['id']]);
        $requests = $stmt->fetchAll();
    }

    jsonResponse(['requests' => $requests]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = parseJsonInput();
$user = currentUser();

$name = trim((string) ($data['name'] ?? ''));
$message = trim((string) ($data['message'] ?? ''));

if ($name === '' || $message === '') {
    jsonResponse(['error' => 'Name and message are required'], 400);
}

if ($user) {
    $email = $user['email'];
    $phone = $user['phone'];
} else {
    $email = trim((string) ($data['email'] ?? ''));
    $phone = trim((string) ($data['phone'] ?? ''));

    if ($email === '' || $phone === '') {
        jsonResponse(['error' => 'Email and phone are required'], 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['error' => 'Invalid email address'], 400);
    }

    if (!preg_match('/^\+?\d{7,15}$/', $phone)) {
        jsonResponse(['error' => 'Phone must contain only digits and optionally start with +'], 400);
    }
}

$pdo = getPDO();
$stmt = $pdo->prepare('INSERT INTO requests (user_id, name, email, phone, message) VALUES (?, ?, ?, ?, ?)');
$stmt->execute([$user['id'] ?? null, $name, $email, $phone, $message]);

jsonResponse(['success' => true]);
