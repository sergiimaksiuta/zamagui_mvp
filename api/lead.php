<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function out(int $code,array $value):void {
  http_response_code($code);echo json_encode($value,JSON_UNESCAPED_UNICODE);exit;
}
if(($_SERVER['REQUEST_METHOD']??'')!=='POST')out(405,['ok'=>false,'message'=>'Method not allowed']);
if((int)($_SERVER['CONTENT_LENGTH']??0)>16000)out(413,['ok'=>false,'message'=>'Payload too large']);
$origin=(string)($_SERVER['HTTP_ORIGIN']??'');
if($origin!==''){
  $parsed=parse_url($origin);
  if(!is_array($parsed)||strtolower((string)($parsed['host']??''))!==strtolower((string)($_SERVER['HTTP_HOST']??'')))out(403,['ok'=>false,'message'=>'Origin mismatch']);
}
ini_set('session.use_strict_mode','1');
$secure=!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off';
session_name('zmg_intake');
session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Lax']);
session_start();
$token=(string)($_POST['csrf_token']??'');
if(empty($_SESSION['zmg_csrf'])||strlen($token)!==64||!hash_equals((string)$_SESSION['zmg_csrf'],$token)||(int)($_SESSION['zmg_csrf_time']??0)<time()-3600)out(403,['ok'=>false,'message'=>'CSRF validation failed']);
if(trim((string)($_POST['website']??''))!=='')out(422,['ok'=>false,'message'=>'Invalid request']);
$name=trim((string)($_POST['name']??''));
$email=trim((string)($_POST['email']??''));
$phone=trim((string)($_POST['phone']??''));
$message=trim((string)($_POST['message']??''));
$interest=trim((string)($_POST['interest']??'Other'));
$allowed=['Growth','Kids Elite','Kids Talent','AI','Guild','Partners','Marketplace','Capital','Franchise','Other'];
if(($_POST['consent']??'')!=='yes'||strlen($name)<2||strlen($name)>240||strlen($message)>2400||!in_array($interest,$allowed,true)||($email===''&&$phone==='')||($email!==''&&!filter_var($email,FILTER_VALIDATE_EMAIL))||strlen($email)>200||strlen($phone)>80||preg_match('/[\r\n]/',$name.$email.$phone))out(422,['ok'=>false,'message'=>'Invalid form values']);
$ip=(string)($_SERVER['REMOTE_ADDR']??'unknown');
$fp=@fopen(sys_get_temp_dir().'/zmg_lead_'.hash('sha256',$ip),'c+');
if(!$fp||!flock($fp,LOCK_EX))out(503,['ok'=>false,'message'=>'Rate limiter unavailable']);
$last=(int)trim((string)stream_get_contents($fp));
if($last>time()-90){flock($fp,LOCK_UN);fclose($fp);out(429,['ok'=>false,'message'=>'Please retry later']);}
$recipient=getenv('ZMG_LEAD_RECIPIENT')?:'business@zamagui.com';
if(!filter_var($recipient,FILTER_VALIDATE_EMAIL)||preg_match('/[\r\n]/',$recipient)){flock($fp,LOCK_UN);fclose($fp);out(503,['ok'=>false,'message'=>'Recipient not configured']);}
$ref=strtoupper(bin2hex(random_bytes(6)));
$plain="Reference: $ref\nInterest: $interest\nName: $name\nEmail: $email\nPhone: $phone\nMessage:\n$message\n";
foreach(['page','source','utm_source','utm_medium','utm_campaign'] as $key){$plain.=ucfirst(str_replace('_',' ',$key)).': '.substr(str_replace(["\r","\n"],' ',(string)($_POST[$key]??'')),0,140)."\n";}
$headers="From: ZaMaGui <no-reply@zamagui.com>\r\nContent-Type: text/plain; charset=UTF-8";
if($email!=='')$headers.="\r\nReply-To: $email";
$sent=@mail($recipient,'ZaMaGui enquiry '.$ref,$plain,$headers);
if(!$sent){flock($fp,LOCK_UN);fclose($fp);out(503,['ok'=>false,'message'=>'Mail transport unavailable']);}
rewind($fp);ftruncate($fp,0);fwrite($fp,(string)time());fflush($fp);flock($fp,LOCK_UN);fclose($fp);
out(200,['ok'=>true,'reference'=>$ref,'message'=>'Accepted by mail transport; actual delivery not verified']);
