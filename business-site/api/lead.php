<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function out(int $code, array $value): void {http_response_code($code); echo json_encode($value, JSON_UNESCAPED_UNICODE); exit;}
if (($_SERVER['REQUEST_METHOD']??'')!=='POST')out(405,['ok'=>false,'error'=>'method']);
if (($_SERVER['HTTP_ORIGIN']??'')!==''&&$_SERVER['HTTP_ORIGIN']!=='https://business.zamagui.com')out(403,['ok'=>false,'error'=>'origin']);
if ((int)($_SERVER['CONTENT_LENGTH']??0)>14000)out(413,['ok'=>false,'error'=>'size']);
if (!empty($_POST['website']))out(200,['ok'=>true,'reference'=>'accepted']);
$name=trim((string)($_POST['name']??'')); $email=trim((string)($_POST['email']??''));$message=trim((string)($_POST['message']??''));$kind=(string)($_POST['kind']??'lead');
if(($_POST['consent']??'')!=='1'||strlen($name)<2||strlen($name)>240||!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($email)>254||strlen($message)<15||strlen($message)>8000||!in_array($kind,['lead','bug'],true))out(422,['ok'=>false,'error'=>'validation']);
$ip=(string)($_SERVER['REMOTE_ADDR']??'unknown');$lockfile=sys_get_temp_dir().'/zmg_biz_'.hash('sha256',$ip);$fp=@fopen($lockfile,'c+');if(!$fp)out(503,['ok'=>false,'error'=>'limiter']);
flock($fp,LOCK_EX);$prev=(int)trim((string)stream_get_contents($fp));if($prev>time()-90){flock($fp,LOCK_UN);fclose($fp);out(429,['ok'=>false,'error'=>'rate']);}
rewind($fp);ftruncate($fp,0);fwrite($fp,(string)time());flock($fp,LOCK_UN);fclose($fp);
$reference=strtoupper(bin2hex(random_bytes(6)));$subject='ZaMaGui Business '.($kind==='bug'?'bug':'lead').' '.$reference;
$plain="Reference: $reference\nKind: $kind\nName: $name\nEmail: $email\nPhone: ".(string)($_POST['phone']??'')."\nCategory: ".(string)($_POST['category']??'')."\nMessage:\n$message\n";
// CRM becomes the authoritative lead store once the protected server config exists.
require_once __DIR__ . '/espo-adapter.php';
$crmConfig = zmg_crm_config();
if ($crmConfig !== null) {
    $crmId = zmg_crm_create_lead([
        'name'=>$name, 'email'=>$email, 'phone'=>(string)($_POST['phone']??''),
        'category'=>(string)($_POST['category']??''), 'kind'=>$kind, 'message'=>$message,
    ]);
    if ($crmId === null) out(503, ['ok'=>false,'error'=>'crm_unavailable']);
    out(200, ['ok'=>true,'reference'=>$reference,'recorded'=>'crm']);
}
// Legacy email fallback remains available until CRM is installed and configured.
// A successful PHP mail() call is NOT proof of mailbox delivery.
$success=@mail('business@zamagui.com',$subject,$plain,"From: ZaMaGui Business <business@zamagui.com>\r\nContent-Type: text/plain; charset=UTF-8");
if(!$success)out(503,['ok'=>false,'error'=>'mail_unavailable']);
out(200,['ok'=>true,'reference'=>$reference]);
