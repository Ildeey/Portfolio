<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function startSession(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

function jsonResponse(mixed $data, int $status = 200): void
{
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function parseJsonInput(): array
{
    $body = file_get_contents('php://input');
    $decoded = json_decode($body, true);

    if (is_array($decoded)) {
        return $decoded;
    }

    return $_POST;
}

function currentUser(): ?array
{
    startSession();

    if (empty($_SESSION['user_id'])) {
        return null;
    }

    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT id, username, email, phone, role FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();

    return $user ?: null;
}

function requireAuth(): array
{
    $user = currentUser();

    if (!$user) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }

    return $user;
}

function requireAdmin(): array
{
    $user = requireAuth();

    if ($user['role'] !== 'admin') {
        jsonResponse(['error' => 'Forbidden'], 403);
    }

    return $user;
}

function ensureAdminUser(): void
{
    $pdo = getPDO();
    $count = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();

    if ($count === 0) {
        $passwordHash = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('INSERT INTO users (username, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute(['admin', 'admin@localhost', $passwordHash, '', 'admin']);
    }
}

function uploadImage(array $file): string
{
    if ($file['error'] !== UPLOAD_ERR_OK) {
        jsonResponse(['error' => 'Upload error'], 400);
    }

    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!in_array($file['type'], $allowedTypes, true)) {
        jsonResponse(['error' => 'Invalid image type'], 400);
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        jsonResponse(['error' => 'Image too large'], 400);
    }

    if (!is_dir(UPLOAD_DIR) && !mkdir(UPLOAD_DIR, 0755, true)) {
        jsonResponse(['error' => 'Unable to create upload directory'], 500);
    }

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
    $safeName = bin2hex(random_bytes(12)) . '.' . $extension;
    $target = UPLOAD_DIR . '/' . $safeName;

    if (!move_uploaded_file($file['tmp_name'], $target)) {
        jsonResponse(['error' => 'Unable to move uploaded file'], 500);
    }

    return $safeName;
}
