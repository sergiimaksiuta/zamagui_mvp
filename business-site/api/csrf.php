<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
if(($_SERVER['REQUEST_METHOD']??'')!=='GET'){http_response_code(405);echo '{"ok":false}';exit;}
ini_set('session.use_strict_mode','1');
session_name('zmg_business_intake');
session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>true,'httponly'=>true,'samesite'=>'Lax']);
session_start();
if(empty($_SESSION['csrf'])||(int)($_SESSION['csrf_time']??0)<time()-3600){$_SESSION['csrf']=bin2hex(random_bytes(32));$_SESSION['csrf_time']=time();}
echo json_encode(['ok'=>true,'csrf_token'=>$_SESSION['csrf']]);
