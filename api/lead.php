<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
function respond(int $code,array $body):void {http_response_code($code);echo json_encode($body,JSON_UNESCAPED_UNICODE);exit;}
if(($_SERVER['REQUEST_METHOD']??'')!=='POST')respond(405,['ok'=>false,'message'=>'Method not allowed']);
if((int)($_SERVER['CONTENT_LENGTH']??0)>16000)respond(413,['ok'=>false,'message'=>'Request too large']);
$origin=(string)($_SERVER['HTTP_ORIGIN']??'');
if($origin!==''&&!in_array($origin,['https://zamagui.com','https://www.zamagui.com'],true))respond(403,['ok'=>false,'message'=>'Invalid origin']);
if(($_SERVER['HTTP_SEC_FETCH_SITE']??'')==='cross-site')respond(403,['ok'=>false,'message'=>'Invalid site']);
ini_set('session.use_strict_mode','1');
$secure=!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off';
session_name('zmg_intake');session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Lax']);session_start();
$token=(string)($_POST['csrf_token']??'');
if(empty($_SESSION['zmg_csrf'])||strlen($token)!==64||!hash_equals((string)$_SESSION['zmg_csrf'],$token)||(int)($_SESSION['zmg_csrf_time']??0)<time()-3600)respond(403,['ok'=>false,'message'=>'CSRF validation failed']);
if(trim((string)($_POST['website']??''))!=='')respond(422,['ok'=>false,'message'=>'Invalid request']);
$name=trim((string)($_POST['name']??''));$email=trim((string)($_POST['email']??''));
$phone=trim((string)($_POST['phone']??''));$message=trim((string)($_POST['message']??''));
$interest=(string)($_POST['interest']??'Other');
$allowed=['Growth','Kids Elite','Kids Talent','AI','Guild','Partners','Marketplace','Capital','Franchise','Other'];
if(($_POST['consent']??'')!=='yes'||strlen($name)<2||strlen($name)>120||
($email===''&&$phone==='')||($email!==''&&!filter_var($email,FILTER_VALIDATE_EMAIL))||
strlen($email)>200||strlen($phone)>40||preg_match('/[\r\n]/',$name.$email.$phone)||
strlen($message)>1200||!in_array($interest,$allowed,true))respond(422,['ok'=>false,'message'=>'Invalid form values']);
$ip=hash('sha256',(string)($_SERVER['REMOTE_ADDR']??'unknown'));
$lock=@fopen(sys_get_temp_dir().'/zmg_general_rate_'.$ip,'c+');
if(!$lock||!flock($lock,LOCK_EX))respond(503,['ok'=>false,'message'=>'Service unavailable']);
if((int)trim((string)stream_get_contents($lock))>time()-45){flock($lock,LOCK_UN);fclose($lock);respond(429,['ok'=>false,'message'=>'Please retry later']);}
$note="Lead submitted via zamagui.com\nInterest: $interest\nMessage:\n$message\n";
foreach(['page','source','utm_source','utm_medium','utm_campaign'] as $k){
 $v=str_replace(["\r","\n"],' ',substr((string)($_POST[$k]??''),0,120));
 $note.=$k.': '.$v."\n";
}
try{
 require_once __DIR__.'/_crm.php';
 $saved=zmg_crm_capture(['name'=>$name,'email'=>$email,'phone'=>$phone,'title'=>'ZaMaGui | '.$interest.' | '.substr(hash('sha256',$message),0,10),'note'=>$note]);
}catch(Throwable $e){flock($lock,LOCK_UN);fclose($lock);respond(503,['ok'=>false,'message'=>'CRM temporarily unavailable']);}
rewind($lock);ftruncate($lock,0);fwrite($lock,(string)time());fflush($lock);flock($lock,LOCK_UN);fclose($lock);
respond(200,['ok'=>true,'reference'=>$saved['ref'],'message'=>'Recorded in CRM']);
