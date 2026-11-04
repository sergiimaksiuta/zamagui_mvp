<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD']??'')!=='GET') {
  http_response_code(405); echo json_encode(['ok'=>false,'message'=>'Method']); exit;
}
ini_set('session.use_strict_mode','1');
$secure=!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off';
session_name('zmg_intake');
session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Lax']);
session_start();
if(empty($_SESSION['zmg_csrf'])||(int)($_SESSION['zmg_csrf_time']??0)<time()-3600){
  $_SESSION['zmg_csrf']=bin2hex(random_bytes(32));
  $_SESSION['zmg_csrf_time']=time();
}
echo json_encode(['ok'=>true,'csrf_token'=>$_SESSION['zmg_csrf']],JSON_UNESCAPED_UNICODE);
