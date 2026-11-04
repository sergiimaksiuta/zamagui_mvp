<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
function out(int $code, array $data):void {http_response_code($code);echo json_encode($data,JSON_UNESCAPED_UNICODE);exit;}
if(($_SERVER['REQUEST_METHOD']??'')!=='POST')out(405,['ok'=>false,'error'=>'method']);
if((int)($_SERVER['CONTENT_LENGTH']??0)>14000)out(413,['ok'=>false,'error'=>'size']);
$origin=(string)($_SERVER['HTTP_ORIGIN']??'');
if($origin!==''&&$origin!=='https://business.zamagui.com')out(403,['ok'=>false,'error'=>'origin']);
if(($_SERVER['HTTP_SEC_FETCH_SITE']??'')==='cross-site')out(403,['ok'=>false,'error'=>'site']);
ini_set('session.use_strict_mode','1');
session_name('zmg_business_intake');
session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>true,'httponly'=>true,'samesite'=>'Lax']);
session_start();
$csrf=(string)($_POST['csrf_token']??'');
if(empty($_SESSION['csrf'])||strlen($csrf)!==64||!hash_equals((string)$_SESSION['csrf'],$csrf)||(int)($_SESSION['csrf_time']??0)<time()-3600)out(403,['ok'=>false,'error'=>'csrf']);
if(trim((string)($_POST['website']??''))!=='')out(422,['ok'=>false,'error'=>'spam']);
$name=trim((string)($_POST['name']??''));$email=trim((string)($_POST['email']??''));
$phone=trim((string)($_POST['phone']??''));
$message=trim((string)($_POST['message']??''));
$category=trim((string)($_POST['category']??'Business'));
$kind=(string)($_POST['kind']??'lead');$lang=(string)($_POST['lang']??'uk');
if(($_POST['consent']??'')!=='1'||strlen($name)<2||strlen($name)>120||
!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($email)>200||
strlen($phone)>40||strlen($message)<15||strlen($message)>4000||
strlen($category)>100||!in_array($kind,['lead','bug'],true)||
!in_array($lang,['uk','ru','en'],true)||preg_match('/[\r\n]/',$name.$email.$phone.$category))out(422,['ok'=>false,'error'=>'validation']);
$ip=hash('sha256',(string)($_SERVER['REMOTE_ADDR']??'unknown'));
$fp=@fopen(sys_get_temp_dir().'/zmg_business_rate_'.$ip,'c+');
if(!$fp||!flock($fp,LOCK_EX))out(503,['ok'=>false,'error'=>'limiter']);
if((int)trim((string)stream_get_contents($fp))>time()-45){flock($fp,LOCK_UN);fclose($fp);out(429,['ok'=>false,'error'=>'rate']);}
try{
 require_once __DIR__.'/_crm.php';
 $result=zmg_crm_capture(['name'=>$name,'email'=>$email,'phone'=>$phone,
 'title'=>'ZaMaGui Business | '.$kind.' | '.$category,
 'note'=>"Kind: $kind\nLanguage: $lang\nCategory: $category\nMessage:\n$message\nSource: business.zamagui.com"
 ]);
}catch(Throwable $e){flock($fp,LOCK_UN);fclose($fp);out(503,['ok'=>false,'error'=>'crm_unavailable']);}
rewind($fp);ftruncate($fp,0);fwrite($fp,(string)time());fflush($fp);flock($fp,LOCK_UN);fclose($fp);
out(200,['ok'=>true,'reference'=>$result['ref'],'status'=>'crm_recorded']);
