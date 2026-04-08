<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// --- CORS and Header config ---
$allowed_origins = ["https://9000-firebase-clearbookgit-1767005762274.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev", "https://system.hariindustries.net", "https://clearbook-olive.vercel.app"];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Vary: Origin");
}
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=utf-8");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once 'db_connect.php'; // Use your existing database connection

// --- Tier Pricing ---
$tier_prices = [
    'premium' => 50.00,
    'standard' => 25.00,
    'basic' => 10.00
];

$invoice_id = isset($_GET['id']) ? $_GET['id'] : null;

if (!$invoice_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invoice ID is required."]);
    exit();
}

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

$stmt = $conn->prepare("SELECT id, company_id, tier, start_date, end_date, paid, paystack_reference FROM subscriptions WHERE paystack_reference = ?");

if ($stmt === false) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database prepare failed: " . $conn->error]);
    exit();
}

$stmt->bind_param("s", $invoice_id);

if ($stmt->execute()) {
    $result = $stmt->get_result();
    $invoice = $result->fetch_assoc();

    if ($invoice) {
        $tier = strtolower($invoice['tier']);
        $invoice['amount'] = isset($tier_prices[$tier]) ? $tier_prices[$tier] : 0;
        // Calculate is_active status based on end_date
        $invoice['is_active'] = strtotime($invoice['end_date']) > time();
        http_response_code(200);
        echo json_encode(["success" => true, "data" => $invoice]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Invoice not found."]);
    }
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to fetch invoice details: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
