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

function featuredColumnExists(PDO $pdo): bool
{
    $stmt = $pdo->query("SHOW COLUMNS FROM projects LIKE 'featured'");
    return (bool) $stmt->fetch();
}

function ensureFeaturedColumn(PDO $pdo): bool
{
    if (featuredColumnExists($pdo)) {
        return true;
    }

    $pdo->exec('ALTER TABLE projects ADD COLUMN featured BOOLEAN DEFAULT FALSE');
    return featuredColumnExists($pdo);
}

function countFeaturedProjects(PDO $pdo): int
{
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM projects WHERE featured = 1');
    $result = $stmt->fetch();
    return (int) ($result['count'] ?? 0);
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
    
    $where = '';
    if (isset($_GET['featured']) && $_GET['featured'] === 'true') {
        $where = ' WHERE featured = 1';
    }
    
    $select = 'SELECT id, title, category, description, image, featured, created_by, created_at' . ($hasProjectDate ? ', project_date' : '') . ' FROM projects' . $where . ' ORDER BY created_at DESC';
    $stmt = $pdo->query($select);
    $projects = $stmt->fetchAll();

    foreach ($projects as &$project) {
        $project['image'] = $project['image'] ? UPLOAD_URL . '/' . $project['image'] : null;
        $project['featured'] = (bool) $project['featured'];
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
    $featured = (bool) ($_POST['featured'] ?? false);
    $imageName = null;

    if ($title === '' || $category === '' || $description === '' || $projectDateRaw === '') {
        jsonResponse(['error' => 'Title, category, date and description are required'], 400);
    }

    $pdo = getPDO();
    ensureProjectDateColumn($pdo);
    ensureFeaturedColumn($pdo);
    
    $projectDate = normalizeProjectDate($projectDateRaw);
    if ($projectDate === null) {
        jsonResponse(['error' => 'Project date must be in dd.mm.yyyy format'], 400);
    }

    if ($featured && countFeaturedProjects($pdo) >= 2) {
        jsonResponse(['error' => 'Maximum 2 featured projects allowed'], 400);
    }

    if (!empty($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
        $imageName = uploadImage($_FILES['image']);
    }

    $hasProjectDate = projectDateColumnExists($pdo);
    if ($hasProjectDate) {
        $stmt = $pdo->prepare('INSERT INTO projects (title, category, description, image, project_date, featured, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$title, $category, $description, $imageName, $projectDate, $featured ? 1 : 0, $admin['id']]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO projects (title, category, description, image, featured, created_by) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$title, $category, $description, $imageName, $featured ? 1 : 0, $admin['id']]);
    }

    $projectId = (int) $pdo->lastInsertId();
    jsonResponse(['project' => [
        'id' => $projectId,
        'title' => $title,
        'category' => $category,
        'description' => $description,
        'image' => $imageName ? UPLOAD_URL . '/' . $imageName : null,
        'project_date' => $projectDateRaw,
        'featured' => $featured,
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

if ($method === 'PATCH') {
    $admin = requireAdmin();

    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) {
        jsonResponse(['error' => 'Project id is required'], 400);
    }

    $pdo = getPDO();
    ensureFeaturedColumn($pdo);
    
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $featured = (bool) ($input['featured'] ?? false);

    if ($featured && countFeaturedProjects($pdo) >= 2) {
        jsonResponse(['error' => 'Maximum 2 featured projects allowed'], 400);
    }

    $stmt = $pdo->prepare('UPDATE projects SET featured = ? WHERE id = ?');
    $stmt->execute([$featured ? 1 : 0, $id]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['error' => 'Project not found'], 404);
    }

    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
