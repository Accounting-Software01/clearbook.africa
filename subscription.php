<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// --- HEADERS --- 
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- CONFIGURATION ---
define('PAYSTACK_SECRET_KEY', 'sk_test_e6077d334cb1f7eed71d7373aae62b6c65005d3b'); 
define('USD_NGN_EXCHANGE_RATE', 1500);
// IMPORTANT: Replace with your actual frontend URL
define('FRONTEND_URL', 'https://9000-firebase-clearbookgit-1767005762274.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev/subscription/verify'); 

// --- DATABASE CONNECTION ---
require_once 'db_connect.php';
if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database connection failed: " . ($conn->connect_error ?? 'Unknown error')]);
    exit();
}

// --- PAYSTACK API FUNCTIONS ---
function initialize_payment($email, $amount, $metadata, $callback_url) {
    $url = "https://api.paystack.co/transaction/initialize";
    $fields = [
        'email' => $email, 
        'amount' => $amount * 100, 
        'metadata' => $metadata,
        'callback_url' => $callback_url
    ];
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($fields));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer " . PAYSTACK_SECRET_KEY, "Cache-Control: no-cache"]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result, true);
}

function verify_payment($reference) {
    $url = 'https://api.paystack.co/transaction/verify/' . rawurlencode($reference);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . PAYSTACK_SECRET_KEY]);
    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result, true);
}

// --- API ROUTING ---
$request_method = $_SERVER['REQUEST_METHOD'];

if ($request_method === 'GET') {
    $company_id = $_GET['company_id'] ?? null;
    if (!$company_id) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Company ID is required."]);
        exit();
    }

    $stmt = $conn->prepare("SELECT * FROM subscriptions WHERE company_id = ? ORDER BY end_date DESC LIMIT 1");
    $stmt->bind_param("s", $company_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $subscription = $result->fetch_assoc();
    $stmt->close();

    if (!$subscription) {
        $id = uniqid('sub_');
        $tier = 'basic';
        $start_date = date('Y-m-d H:i:s');
        $end_date = date('Y-m-d H:i:s');
        $paid = 0;

        $insert_stmt = $conn->prepare(
            "INSERT INTO subscriptions (id, company_id, tier, start_date, end_date, paid) VALUES (?, ?, ?, ?, ?, ?)"
        );
        $insert_stmt->bind_param("sssssi", $id, $company_id, $tier, $start_date, $end_date, $paid);
        
        if (!$insert_stmt->execute()) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Failed to create initial subscription record.", "details" => $insert_stmt->error]);
            $insert_stmt->close();
            $conn->close();
            exit();
        }
        $insert_stmt->close();

        $stmt = $conn->prepare("SELECT * FROM subscriptions WHERE id = ?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $subscription = $stmt->get_result()->fetch_assoc();
        $stmt->close();
    }

    $is_active = false;
    if ($subscription) {
        $end_date_obj = new DateTime($subscription['end_date']);
        if ($subscription['paid'] == 1 && new DateTime() < $end_date_obj) {
            $is_active = true;
        }
    }
    
    $response_data = $subscription ? array_merge($subscription, ['is_active' => $is_active]) : null;
    
    echo json_encode(["success" => true, "data" => $response_data]);

} elseif ($request_method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

    if ($action === 'initialize') {
        $company_id = $data['company_id'] ?? null;
        $tier = $data['tier'] ?? null;
        if (!$data['email'] || !$company_id || !$tier) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Email, company ID, and tier are required."]);
            exit();
        }
        
        $prices_usd = ['basic' => 10, 'premium' => 25];
        $price_ngn = ($prices_usd[$tier] ?? 0) * USD_NGN_EXCHANGE_RATE;
        if ($price_ngn <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Invalid subscription tier."]);
            exit();
        }

        $metadata = ['company_id' => $company_id, 'tier' => $tier, 'duration_days' => 30];
        $callback_url = FRONTEND_URL . '/subscription/verify';
        $payment_response = initialize_payment($data['email'], $price_ngn, $metadata, $callback_url);

        echo json_encode($payment_response);

    } elseif ($action === 'verify') {
        $reference = $data['reference'] ?? null;
        if (!$reference) {
             http_response_code(400);
             echo json_encode(["success" => false, "error" => "Payment reference is required."]);
             exit();
        }

        $verification = verify_payment($reference);

        if ($verification && $verification['status'] && $verification['data']['status'] === 'success') {
            $metadata = $verification['data']['metadata'];
            $company_id = $metadata['company_id'];
            $tier = $metadata['tier'];
            $duration_days = $metadata['duration_days'] ?? 30;
            $paid = 1;
            $start_date = date('Y-m-d H:i:s');
            $end_date = date('Y-m-d H:i:s', strtotime(" + $duration_days days"));

            $stmt = $conn->prepare("UPDATE subscriptions SET tier = ?, start_date = ?, end_date = ?, paid = ?, paystack_reference = ? WHERE company_id = ?");
            $stmt->bind_param("sssiss", $tier, $start_date, $end_date, $paid, $reference, $company_id);

            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode(["success" => true, "message" => "Subscription updated successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Failed to update subscription.", "details" => $stmt->error]);
            }
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Payment verification failed."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Invalid or missing action specified."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed."]);
}

$conn->close();
