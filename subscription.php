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
define('PAYSTACK_SECRET_KEY', 'YOUR_PAYSTACK_SECRET_KEY'); 
define('USD_NGN_EXCHANGE_RATE', 1500);

// --- DATABASE CONNECTION ---
require_once __DIR__ . '/src/app/api/db_connect.php';
if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database connection failed: " . ($conn->connect_error ?? 'Unknown error')]);
    exit();
}

// --- PAYSTACK API FUNCTIONS ---
function initialize_payment($email, $amount, $metadata) {
    $url = "https://api.paystack.co/transaction/initialize";
    $fields = ['email' => $email, 'amount' => $amount * 100, 'metadata' => $metadata];
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
    // --- Fetch company's subscription status ---
    $company_id = $_GET['company_id'] ?? null;
    if (!$company_id) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Company ID is required."]);
        exit();
    }

    $stmt = $conn->prepare("SELECT tier, end_date FROM subscriptions WHERE company_id = ? AND paid = 1 ORDER BY end_date DESC LIMIT 1");
    $stmt->bind_param("s", $company_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($subscription = $result->fetch_assoc()) {
        $end_date = new DateTime($subscription['end_date']);
        $subscription['is_active'] = new DateTime() < $end_date;
        echo json_encode(["success" => true, "data" => $subscription]);
    } else {
        echo json_encode(["success" => true, "data" => null]);
    }
    $stmt->close();

} elseif ($request_method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

    if ($action === 'initialize') {
        // --- Initialize Payment Transaction ---
        $company_id = $data['company_id'] ?? null;
        $tier = $data['tier'] ?? null;
        if (!$data['email'] || !$company_id || !$tier) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Email, company ID, and tier are required."]);
            exit();
        }
        
        $prices_usd = ['basic' => 10, 'premium' => 25];
        if (!array_key_exists($tier, $prices_usd)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Invalid subscription tier."]);
            exit();
        }

        $price_ngn = $prices_usd[$tier] * USD_NGN_EXCHANGE_RATE;
        $metadata = ['company_id' => $company_id, 'tier' => $tier, 'duration_days' => 30];
        $payment_response = initialize_payment($data['email'], $price_ngn, $metadata);

        if ($payment_response && $payment_response['status']) {
            echo json_encode($payment_response);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Could not initialize payment.', 'details' => $payment_response['message'] ?? '']);
        }

    } elseif ($action === 'verify') {
        // --- Verify Payment & Create Subscription in DB ---
        $reference = $data['reference'] ?? null;
        if (!$reference) {
             http_response_code(400);
             echo json_encode(["success" => false, "error" => "Payment reference is required."]);
             exit();
        }

        $verification = verify_payment($reference);

        if ($verification && $verification['status'] && $verification['data']['status'] === 'success') {
            $metadata = $verification['data']['metadata'];
            $id = uniqid('sub_');
            $paid = true;
            $start_date = date('Y-m-d H:i:s');
            $end_date = date('Y-m-d H:i:s', strtotime("+" . ($metadata['duration_days'] ?? 30) . " days"));

            $stmt = $conn->prepare("INSERT INTO subscriptions (id, company_id, tier, start_date, end_date, paid, paystack_reference) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssssis", $id, $metadata['company_id'], $metadata['tier'], $start_date, $end_date, $paid, $reference);

            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(["success" => true, "message" => "Subscription created successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Failed to save subscription to database."]);
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
?>