<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

ensureAdminUser();

$method = $_SERVER['REQUEST_METHOD'];

function projectDateColumnExists(PDO $pdo): bool
{
    $stmt = $pdo->query("SHOW COLUMNS FROM projects LIKE 'project_date'");
    return (bool) $stmt->fetch();
}

function ensureProjectDateColumn(PDO $pdo): bool
{
    if (projectDateColumnExists($pdo)) {
        return true;
    }

    $pdo->exec('ALTER TABLE projects ADD COLUMN project_date DATE DEFAULT NULL');
    return projectDateColumnExists($pdo);
}

function normalizeProjectDate(string $value): ?string
{
    $value = trim($value);
    if ($value === '') {
        return null;
    }

    if (!preg_match('/^(\d{2})\.(\d{2})\.(\d{4})$/', $value, $matches)) {
        return null;
    }

    [$_, $day, $month, $year] = $matches;
    if (!checkdate((int) $month, (int) $day, (int) $year)) {
        return null;
    }

    return sprintf('%04d-%02d-%02d', $year, $month, $day);
}

if ($method === 'GET') {
    $pdo = getPDO();
    $hasProjectDate = projectDateColumnExists($pdo);
    $select = 'SELECT id, title, category, description, image, created_by, created_at' . ($hasProjectDate ? ', project_date' : '') . ' FROM projects ORDER BY created_at DESC';
    $stmt = $pdo->query($select);
    $projects = $stmt->fetchAll();

    foreach ($projects as &$project) {
        $project['image'] = $project['image'] ? UPLOAD_URL . '/' . $project['image'] : null;
        if (!empty($project['project_date'])) {
            $project['project_date'] = date('d.m.Y', strtotime($project['project_date']));
        }
    }

    jsonResponse(['projects' => $projects]);
}

if ($method === 'POST') {
    $admin = requireAdmin();

    $title = trim((string) ($_POST['title'] ?? ''));
    $category = trim((string) ($_POST['category'] ?? ''));
    $description = trim((string) ($_POST['description'] ?? ''));
    $projectDateRaw = trim((string) ($_POST['project_date'] ?? ''));
    $imageName = null;

    if ($title === '' || $category === '' || $description === '' || $projectDateRaw === '') {
        jsonResponse(['error' => 'Title, category, date and description are required'], 400);
    }

    $pdo = getPDO();
    ensureProjectDateColumn($pdo);
    $projectDate = normalizeProjectDate($projectDateRaw);
    if ($projectDate === null) {
        jsonResponse(['error' => 'Project date must be in dd.mm.yyyy format'], 400);
    }

    if (!empty($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
        $imageName = uploadImage($_FILES['image']);
    }

    $hasProjectDate = projectDateColumnExists($pdo);
    if ($hasProjectDate) {
        $stmt = $pdo->prepare('INSERT INTO projects (title, category, description, image, project_date, created_by) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$title, $category, $description, $imageName, $projectDate, $admin['id']]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO projects (title, category, description, image, created_by) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$title, $category, $description, $imageName, $admin['id']]);
    }

    $projectId = (int) $pdo->lastInsertId();
    jsonResponse(['project' => [
        'id' => $projectId,
        'title' => $title,
        'category' => $category,
        'description' => $description,
        'image' => $imageName ? UPLOAD_URL . '/' . $imageName : null,
        'project_date' => $projectDateRaw,
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
