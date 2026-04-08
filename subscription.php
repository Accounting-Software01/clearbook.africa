<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// --- CORS AND HEADERS ---
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
define('STRIPE_SECRET_KEY', 'YOUR_STRIPE_SECRET_KEY_HERE');
define('PAYPAL_CLIENT_ID', 'YOUR_PAYPAL_CLIENT_ID_HERE');
define('PAYPAL_CLIENT_SECRET', 'YOUR_PAYPAL_CLIENT_SECRET_HERE');
define('PAYPAL_API_URL', 'https://api-m.sandbox.paypal.com');

// --- NEW: Exchange rate for Paystack NGN payments ---
define('USD_NGN_EXCHANGE_RATE', 1500);

// Frontend URLs
define('FRONTEND_VERIFY_URL', 'https://9000-firebase-clearbookgit-1767005762274.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev/subscription/verify');
define('SUCCESS_URL', 'https://9000-firebase-clearbookgit-1767005762274.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev/subscription?status=success');
define('CANCEL_URL', 'https://9000-firebase-clearbookgit-1767005762274.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev/subscription?status=cancelled');

// Tier pricing in USD
$tier_prices = [
    'basic' => 29.99,
    'standard' => 89.99,
    'premium' => 49.99
];


// --- DATABASE CONNECTION ---
require_once 'db_connect.php';
if (!isset($conn) || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database connection failed: " . ($conn->connect_error ?? 'Unknown error')]);
    exit();
}

// === PAYMENT GATEWAY FUNCTIONS =============================================

// --- PAYSTACK (Updated to be flexible) ---
function initialize_paystack_payment($email, $amount, $currency, $metadata) {
    $url = "https://api.paystack.co/transaction/initialize";
    $fields = [
        'email' => $email,
        'amount' => $amount * 100, // Amount in kobo/cents
        'currency' => $currency,
        'metadata' => $metadata,
        'callback_url' => FRONTEND_VERIFY_URL . '?gateway=paystack'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($fields));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer " . PAYSTACK_SECRET_KEY, "Cache-Control: no-cache"]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    curl_close($ch);
    
    $response = json_decode($result, true);
    if ($response && $response['status']) {
        return ['success' => true, 'authorization_url' => $response['data']['authorization_url']];
    }
    return ['success' => false, 'error' => $response['message'] ?? 'Paystack API error.'];
}

function verify_paystack_payment($reference) {
    $url = 'https://api.paystack.co/transaction/verify/' . rawurlencode($reference);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . PAYSTACK_SECRET_KEY]);
    $result = curl_exec($ch);
    curl_close($ch);
    
    $response = json_decode($result, true);
    if ($response && $response['status'] && $response['data']['status'] === 'success') {
        return ['success' => true, 'data' => $response['data']];
    }
    return ['success' => false, 'error' => $response['message'] ?? 'Paystack verification failed.'];
}


// --- STRIPE (Unchanged) ---
function initialize_stripe_payment($email, $amount_usd, $metadata) {
    $url = 'https://api.stripe.com/v1/checkout/sessions';
    $payload = [
        'payment_method_types' => ['card'],
        'line_items' => [[ 'price_data' => [ 'currency' => 'usd', 'product_data' => [ 'name' => 'ClearBooks Subscription (' . ucfirst($metadata['tier']) . ')', ], 'unit_amount' => $amount_usd * 100, ], 'quantity' => 1, ]],
        'mode' => 'payment',
        'customer_email' => $email,
        'success_url' => FRONTEND_VERIFY_URL . '?gateway=stripe&session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => CANCEL_URL,
        'metadata' => $metadata
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payload));
    curl_setopt($ch, CURLOPT_USERPWD, STRIPE_SECRET_KEY . ':');
    $result = curl_exec($ch);
    curl_close($ch);
    
    $response = json_decode($result, true);
    if (isset($response['url'])) {
        return ['success' => true, 'authorization_url' => $response['url']];
    }
    return ['success' => false, 'error' => $response['error']['message'] ?? 'Stripe API error.'];
}

function verify_stripe_payment($session_id) {
    $url = 'https://api.stripe.com/v1/checkout/sessions/' . rawurlencode($session_id);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERPWD, STRIPE_SECRET_KEY . ':');
    $result = curl_exec($ch);
    curl_close($ch);
    $response = json_decode($result, true);
    if (isset($response['id']) && $response['payment_status'] === 'paid') {
        return ['success' => true, 'data' => ['status' => 'success', 'reference' => $response['payment_intent'], 'metadata' => $response['metadata']]];
    }
    return ['success' => false, 'error' => 'Stripe verification failed.'];
}


// --- PAYPAL (Unchanged) ---
function get_paypal_access_token() {
    $url = PAYPAL_API_URL . '/v1/oauth2/token';
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, 'grant_type=client_credentials');
    curl_setopt($ch, CURLOPT_USERPWD, PAYPAL_CLIENT_ID . ':' . PAYPAL_CLIENT_SECRET);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
    $result = curl_exec($ch);
    curl_close($ch);
    $response = json_decode($result, true);
    return $response['access_token'] ?? null;
}

function initialize_paypal_payment($email, $amount_usd, $metadata) {
    $token = get_paypal_access_token();
    if (!$token) return ['success' => false, 'error' => 'Could not get PayPal access token.'];
    $url = PAYPAL_API_URL . '/v2/checkout/orders';
    $payload = [ 'intent' => 'CAPTURE', 'purchase_units' => [[ 'amount' => ['currency_code' => 'USD', 'value' => (string)$amount_usd], 'custom_id' => json_encode($metadata) ]], 'application_context' => [ 'return_url' => FRONTEND_VERIFY_URL . '?gateway=paypal', 'cancel_url' => CANCEL_URL, 'brand_name' => 'ClearBooks Africa', 'user_action' => 'PAY_NOW' ] ];
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer " . $token, "Content-Type: application/json"]);
    $result = curl_exec($ch);
    curl_close($ch);
    $response = json_decode($result, true);
    $approval_link = array_filter($response['links'] ?? [], function($link){ return $link['rel'] === 'approve'; });
    if (!empty($approval_link)) {
        return ['success' => true, 'authorization_url' => current($approval_link)['href']];
    }
    return ['success' => false, 'error' => $response['message'] ?? 'PayPal API error.'];
}

function verify_paypal_payment($order_id) {
    $token = get_paypal_access_token();
    if (!$token) return ['success' => false, 'error' => 'Could not get PayPal access token.'];
    $capture_url = PAYPAL_API_URL . '/v2/checkout/orders/' . rawurlencode($order_id) . '/capture';
    $ch_capture = curl_init();
    curl_setopt($ch_capture, CURLOPT_URL, $capture_url);
    curl_setopt($ch_capture, CURLOPT_POST, true);
    curl_setopt($ch_capture, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch_capture, CURLOPT_HTTPHEADER, ["Authorization: Bearer " . $token, "Content-Type: application/json"]);
    $capture_result = curl_exec($ch_capture);
    curl_close($ch_capture);
    $capture_response = json_decode($capture_result, true);
    if (isset($capture_response['status']) && $capture_response['status'] === 'COMPLETED') {
        $custom_id_json = $capture_response['purchase_units'][0]['custom_id'] ?? '{}';
        $metadata = json_decode($custom_id_json, true);
        return ['success' => true, 'data' => ['status' => 'success', 'reference' => $capture_response['id'], 'metadata' => $metadata]];
    }
    return ['success' => false, 'error' => 'PayPal payment capture failed.'];
}
// === END PAYMENT GATEWAY FUNCTIONS ===========================================



// --- API ROUTING ---
$request_method = $_SERVER['REQUEST_METHOD'];

if ($request_method === 'GET') {
    // GET logic remains the same
    $company_id = $_GET['company_id'] ?? null;
    if (!$company_id) { http_response_code(400); echo json_encode(["success" => false, "error" => "Company ID is required."]); exit(); }
    $stmt = $conn->prepare("SELECT * FROM subscriptions WHERE company_id = ? ORDER BY end_date DESC LIMIT 1");
    $stmt->bind_param("s", $company_id);
    $stmt->execute();
    $subscription = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$subscription) {
        $id = uniqid('sub_'); $tier = 'basic'; $start_date = date('Y-m-d H:i:s'); $end_date = date('Y-m-d H:i:s'); $paid = 0;
        $insert_stmt = $conn->prepare("INSERT INTO subscriptions (id, company_id, tier, start_date, end_date, paid) VALUES (?, ?, ?, ?, ?, ?)");
        $insert_stmt->bind_param("sssssi", $id, $company_id, $tier, $start_date, $end_date, $paid);
        $insert_stmt->execute(); $insert_stmt->close();
        $stmt = $conn->prepare("SELECT * FROM subscriptions WHERE id = ?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $subscription = $stmt->get_result()->fetch_assoc();
        $stmt->close();
    }
    $is_active = false;
    if ($subscription) { $end_date_obj = new DateTime($subscription['end_date']); if ($subscription['paid'] == 1 && new DateTime() < $end_date_obj) $is_active = true; }
    $response_data = $subscription ? array_merge($subscription, ['is_active' => $is_active]) : null;
    echo json_encode(["success" => true, "data" => $response_data]);

} elseif ($request_method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

    if ($action === 'initialize') {
        $company_id = $data['company_id'] ?? null;
        $tier = $data['tier'] ?? null;
        $email = $data['email'] ?? null;
        $gateway = $data['gateway'] ?? 'paystack';

        if (!$email || !$company_id || !$tier) { http_response_code(400); echo json_encode(["success" => false, "error" => "Email, company ID, and tier are required."]); exit(); }
        
        $price_usd = $tier_prices[$tier] ?? 0;
        if ($price_usd <= 0) { http_response_code(400); echo json_encode(["success" => false, "error" => "Invalid subscription tier."]); exit(); }

        $metadata = ['company_id' => $company_id, 'tier' => $tier, 'duration_days' => 30, 'gateway' => $gateway];
        $payment_response = ['success' => false, 'error' => 'Invalid payment gateway.'];
        
        // --- UPDATED: Gateway logic with currency handling ---
        switch($gateway) {
            case 'paystack':
                $price_ngn = $price_usd * USD_NGN_EXCHANGE_RATE;
                $payment_response = initialize_paystack_payment($email, $price_ngn, 'NGN', $metadata);
                break;
            case 'stripe':
                $payment_response = initialize_stripe_payment($email, $price_usd, $metadata);
                break;
            case 'paypal':
                $payment_response = initialize_paypal_payment($email, $price_usd, $metadata);
                break;
        }

        if ($payment_response['success']) {
            echo json_encode(['status' => true, 'data' => ['authorization_url' => $payment_response['authorization_url']]]);
        } else {
            echo json_encode(['status' => false, 'message' => $payment_response['error']]);
        }

    } elseif ($action === 'verify') {
        $gateway = $data['gateway'] ?? null;
        $reference = $data['reference'] ?? null;
        
        if (!$gateway || !$reference) { http_response_code(400); echo json_encode(["success" => false, "error" => "Payment gateway and reference are required."]); exit(); }

        $verification = ['success' => false, 'error' => 'Invalid gateway for verification.'];
        switch($gateway) {
            case 'paystack': $verification = verify_paystack_payment($reference); break;
            case 'stripe': $verification = verify_stripe_payment($reference); break;
            case 'paypal': $verification = verify_paypal_payment($reference); break;
        }

        if ($verification['success'] && $verification['data']['status'] === 'success') {
            $metadata = $verification['data']['metadata'];
            $company_id = $metadata['company_id'];
            $tier = $metadata['tier'];
            $duration_days = $metadata['duration_days'] ?? 30;
            $payment_ref = $verification['data']['reference'];
            $paid = 1;
            $start_date = date('Y-m-d H:i:s');
            $end_date = date('Y-m-d H:i:s', strtotime(" + {$duration_days} days"));

            $stmt = $conn->prepare("UPDATE subscriptions SET tier = ?, start_date = ?, end_date = ?, paid = ?, paystack_reference = ? WHERE company_id = ?");
            $stmt->bind_param("sssiss", $tier, $start_date, $end_date, $paid, $payment_ref, $company_id);

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
            echo json_encode(["success" => false, "error" => "Payment verification failed.", "details" => $verification['error'] ?? '']);
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
