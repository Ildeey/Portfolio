<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data = parseJsonInput();
$user = currentUser();

$name = trim((string) ($data['name'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));
$phone = trim((string) ($data['phone'] ?? ''));
$message = trim((string) ($data['message'] ?? ''));

if ($name === '' || $email === '' || $phone === '') {
    jsonResponse(['error' => 'Name, email and phone are required'], 400);
}

$pdo = getPDO();
$stmt = $pdo->prepare('INSERT INTO requests (user_id, name, email, phone, message) VALUES (?, ?, ?, ?, ?)');
$stmt->execute([$user['id'] ?? null, $name, $email, $phone, $message]);

jsonResponse(['success' => true]);
