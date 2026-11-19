<?php
declare(strict_types=1);
/**
 * Server-side only. Store CRM credentials in a PHP file OUTSIDE document root:
 * /home4/dataforg/zmg-private/crm.php
 * Example config: return ['url'=>'https://crm.zamagui.com','api_key'=>'SECRET'];
 */
function zmg_crm_config(): ?array {
    $documentRoot = realpath((string)($_SERVER['DOCUMENT_ROOT'] ?? ''));
    if ($documentRoot === false) return null;
    $path = dirname($documentRoot) . '/zmg-private/crm.php';
    if (!is_file($path)) return null;
    $config = require $path;
    if (!is_array($config)) return null;
    $url = rtrim((string)($config['url'] ?? ''), '/');
    $key = (string)($config['api_key'] ?? '');
    $parts = parse_url($url);
    if (($parts['scheme'] ?? '') !== 'https' || !preg_match('/^crm\.zamagui\.com$/i', (string)($parts['host'] ?? '')) || $key === '') return null;
    return ['url'=>$url,'api_key'=>$key];
}
/** Returns the created CRM lead ID or null on failure. Never log private form content. */
function zmg_crm_create_lead(array $lead): ?string {
    $config = zmg_crm_config();
    if (!$config || !function_exists('curl_init')) return null;
    $fullName = preg_split('/\s+/u', trim((string)$lead['name'])) ?: [];
    $firstName = count($fullName) > 1 ? array_shift($fullName) : '';
    $lastName = implode(' ', $fullName);
    $payload = [
        'firstName'=>$firstName,
        'lastName'=>$lastName ?: 'Website visitor',
        'emailAddress'=>(string)$lead['email'],
        'phoneNumber'=>(string)$lead['phone'],
        'description'=>"Source: ZaMaGui Business\nKind: ".(string)$lead['kind']."\nCategory: ".(string)$lead['category']."\n\n".(string)$lead['message'],
    ];
    $ch = curl_init($config['url'].'/api/v1/Lead');
    curl_setopt_array($ch, [
        CURLOPT_POST=>true,
        CURLOPT_POSTFIELDS=>json_encode($payload, JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE),
        CURLOPT_HTTPHEADER=>['Content-Type: application/json','Accept: application/json','X-Api-Key: '.$config['api_key']],
        CURLOPT_RETURNTRANSFER=>true,
        CURLOPT_CONNECTTIMEOUT=>5,
        CURLOPT_TIMEOUT=>12,
        CURLOPT_FOLLOWLOCATION=>false,
        CURLOPT_SSL_VERIFYPEER=>true,
        CURLOPT_SSL_VERIFYHOST=>2,
    ]);
    $response = curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if (!is_string($response) || $http < 200 || $http >= 300) return null;
    $data = json_decode($response, true);
    return is_array($data) && is_string($data['id'] ?? null) ? $data['id'] : null;
}
