<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// --- HEADERS & CORS ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- DATABASE CONNECTION ---
require_once 'db_connect.php';
if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database connection failed: " . ($conn->connect_error ?? 'Unknown error')]);
    exit();
}

// --- API ROUTING ---
$action = $_POST['action'] ?? null;
if (!$action) {
    $json_data = json_decode(file_get_contents("php://input"), true);
    $action = $json_data['action'] ?? null;
}

switch ($action) {
    case 'update_profile':
        update_profile($conn, $json_data);
        break;
    case 'change_password':
        change_password($conn, $json_data);
        break;
    case 'update_dp':
        update_profile_picture($conn);
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No valid action specified.']);
        break;
}

$conn->close();

// === FUNCTIONS =============================================

/**
 * DISABLED: Updates to user profile information are not permitted.
 */
function update_profile($conn, $data) {
    http_response_code(403); // Forbidden
    echo json_encode(['success' => false, 'error' => 'Updating profile information is not permitted.']);
    return;
}

/**
 * Changes the user's password after verifying the current one.
 * UPDATED: Uses correct 'password_hash' column.
 */
function change_password($conn, $data) {
    $user_id = $data['user_id'] ?? null;
    $currentPassword = $data['currentPassword'] ?? null;
    $newPassword = $data['newPassword'] ?? null;

    if (!$user_id || !$currentPassword || !$newPassword) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields: user_id, currentPassword, newPassword.']);
        return;
    }

    // 1. Get current password hash from DB
    $stmt = $conn->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found.']);
        return;
    }

    // 2. Verify current password
    if (!password_verify($currentPassword, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Incorrect current password.']);
        return;
    }

    // 3. Hash new password and update in DB
    $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $update_stmt = $conn->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $update_stmt->bind_param("si", $newPasswordHash, $user_id);

    if ($update_stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Password updated successfully.']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to update password.', 'details' => $update_stmt->error]);
    }
    $stmt->close();
    $update_stmt->close();
}

/**
 * DISABLED: The users table does not support profile picture URLs.
 */
function update_profile_picture($conn) {
    http_response_code(403); // Forbidden
    echo json_encode(['success' => false, 'error' => 'Updating the profile picture is not supported.']);
    return;
}
