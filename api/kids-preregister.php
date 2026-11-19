<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
function fail(int $code,string $error):void {http_response_code($code);echo json_encode(['ok'=>false,'error'=>$error]);exit;}
if(($_SERVER['REQUEST_METHOD']??'')!=='POST')fail(405,'method');
if((int)($_SERVER['CONTENT_LENGTH']??0)>10000)fail(413,'size');
$origin=(string)($_SERVER['HTTP_ORIGIN']??'');
if($origin!==''&&$origin!=='https://zamagui.com'&&$origin!=='https://www.zamagui.com')fail(403,'origin');
if(($_SERVER['HTTP_SEC_FETCH_SITE']??'')==='cross-site')fail(403,'site');
ini_set('session.use_strict_mode','1');
$secure=!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off';
session_name('zmg_intake');session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Lax']);session_start();
$csrf=(string)($_POST['csrf_token']??'');
if(!isset($_SESSION['zmg_csrf'])||strlen($csrf)!==64||!hash_equals((string)$_SESSION['zmg_csrf'],$csrf)||(int)($_SESSION['zmg_csrf_time']??0)<time()-3600)fail(403,'csrf');
if(trim((string)($_POST['website']??''))!=='')fail(422,'spam');
$name=trim((string)($_POST['name']??''));
$email=trim((string)($_POST['email']??''));
$phone=trim((string)($_POST['phone']??''));
$age=filter_var($_POST['age']??null,FILTER_VALIDATE_INT);
$cohort=(string)($_POST['cohort']??'');
$duration=(string)($_POST['duration']??'');
$role=(string)($_POST['role']??'');
$locale=(string)($_POST['lang']??'uk');
$topic=(string)($_POST['interest']??'undecided');
$channel=(string)($_POST['channel']??'email');
$allowedTopics=['ai','software','entrepreneurship','design','leadership','undecided'];
if(strlen($name)<2||strlen($name)>120||!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($email)>200||
strlen($phone)>40||preg_match('/[\r\n]/',$name.$email.$phone)||
$age===false||$age<12||$age>22||
!in_array($cohort,['school-12-16','student-17-22'],true)||
($age<=16&&$cohort!=='school-12-16')||($age>=17&&$cohort!=='student-17-22')||
!in_array($duration,['12','24'],true)||
!in_array($role,['guardian','self'],true)||
($age<18&&$role!=='guardian')||
!in_array($locale,['uk','ru','en'],true)||!in_array($topic,$allowedTopics,true)||
!in_array($channel,['email','phone','telegram'],true)||
($_POST['consent']??'')!=='yes')fail(422,'validation');
if(!function_exists('curl_init'))fail(503,'service_not_configured');
$ip=hash('sha256',(string)($_SERVER['REMOTE_ADDR']??'unknown'));
$limiter=@fopen(sys_get_temp_dir().'/zmg_kids_rate_'.$ip,'c+');
if(!$limiter||!flock($limiter,LOCK_EX))fail(503,'limiter');
$recent=(int)trim((string)stream_get_contents($limiter));
if($recent>time()-45){flock($limiter,LOCK_UN);fclose($limiter);fail(429,'rate_limit');}
$ageRange=$cohort==='school-12-16'?'12–16':'17–22';
$note='ZaMaGui Kids / pre-registration / start 2027-01-15'
."\nTrack: ".$ageRange."\nParticipant age: ".$age."\nDuration: ".$duration." months"
."\nApplicant role: ".$role."\nInterest: ".$topic."\nPreferred contact: ".$channel
."\nLanguage: ".$locale."\nSource: zamagui.com/kids-2027.html"
."\nConsent: communication about requested programme only."
."\nNo participant name, birthday or personal profile collected.";
try {
    require_once __DIR__.'/_crm.php';
    $result=zmg_crm_capture([
      'name'=>$name,'email'=>$email,'phone'=>$phone,
      'title'=>'ZaMaGui Kids 2027 | '.$ageRange.' | '.$duration.'m | Jan 15',
      'note'=>$note
    ]);
} catch(Throwable $e) {
    flock($limiter,LOCK_UN);fclose($limiter);
    fail(503,'crm_unavailable');
}
rewind($limiter);ftruncate($limiter,0);fwrite($limiter,(string)time());fflush($limiter);flock($limiter,LOCK_UN);fclose($limiter);
echo json_encode(['ok'=>true,'reference'=>$result['ref'],'status'=>'pre_registered'],JSON_UNESCAPED_UNICODE);
