<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

ensureAdminUser();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $pdo = getPDO();
    $stmt = $pdo->query('SELECT id, title, category, description, image, created_by, created_at FROM projects ORDER BY created_at DESC');
    $projects = $stmt->fetchAll();

    foreach ($projects as &$project) {
        $project['image'] = $project['image'] ? UPLOAD_URL . '/' . $project['image'] : null;
    }

    jsonResponse(['projects' => $projects]);
}

if ($method === 'POST') {
    $admin = requireAdmin();

    $title = trim((string) ($_POST['title'] ?? ''));
    $category = trim((string) ($_POST['category'] ?? ''));
    $description = trim((string) ($_POST['description'] ?? ''));
    $imageName = null;

    if ($title === '' || $category === '' || $description === '') {
        jsonResponse(['error' => 'Title, category and description are required'], 400);
    }

    if (!empty($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
        $imageName = uploadImage($_FILES['image']);
    }

    $pdo = getPDO();
    $stmt = $pdo->prepare('INSERT INTO projects (title, category, description, image, created_by) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$title, $category, $description, $imageName, $admin['id']]);

    $projectId = (int) $pdo->lastInsertId();
    jsonResponse(['project' => [
        'id' => $projectId,
        'title' => $title,
        'category' => $category,
        'description' => $description,
        'image' => $imageName ? UPLOAD_URL . '/' . $imageName : null,
        'created_by' => $admin['id'],
        'created_at' => date('Y-m-d H:i:s'),
    ]], 201);
}

if ($method === 'DELETE') {
    $admin = requireAdmin();

    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) {
        jsonResponse(['error' => 'Project id is required'], 400);
    }

    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT image FROM projects WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $project = $stmt->fetch();

    if (!$project) {
        jsonResponse(['error' => 'Project not found'], 404);
    }

    if ($project['image']) {
        $filePath = UPLOAD_DIR . '/' . $project['image'];
        if (is_file($filePath)) {
            unlink($filePath);
        }
    }

    $stmt = $pdo->prepare('DELETE FROM projects WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
