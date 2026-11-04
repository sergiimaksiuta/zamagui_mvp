<?php
declare(strict_types=1);
/** Shared server-only Pipedrive adapter. Never emit tokens, names or contacts in error logs. */
function zmg_crm_request(string $path, array $payload, string $token): array {
    if (!function_exists('curl_init')) throw new RuntimeException('crm_curl_missing');
    $ch = curl_init('https://api.pipedrive.com'.$path);
    if ($ch === false) throw new RuntimeException('crm_connection');
    curl_setopt_array($ch, [
        CURLOPT_POST=>true,
        CURLOPT_POSTFIELDS=>json_encode($payload, JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER=>['x-api-token: '.$token, 'Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_RETURNTRANSFER=>true, CURLOPT_CONNECTTIMEOUT=>5, CURLOPT_TIMEOUT=>12,
        CURLOPT_FOLLOWLOCATION=>false, CURLOPT_SSL_VERIFYPEER=>true, CURLOPT_SSL_VERIFYHOST=>2,
        CURLOPT_MAXREDIRS=>0, CURLOPT_USERAGENT=>'ZaMaGui-CRM/2027'
    ]);
    $raw=curl_exec($ch);
    $status=(int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if (!is_string($raw)||$status<200||$status>=300) throw new RuntimeException('crm_upstream_unavailable');
    $result=json_decode($raw,true);
    if (!is_array($result)||($result['success']??false)!==true)throw new RuntimeException('crm_response_invalid');
    return (array)($result['data']??[]);
}
function zmg_crm_capture(array $lead): array {
    $token=trim((string)(getenv('ZMG_PIPEDRIVE_API_TOKEN')?:''));
    if ($token==='') throw new RuntimeException('crm_not_configured');
    $email=strtolower(trim((string)$lead['email']));
    $name=trim((string)$lead['name']);
    $title=trim((string)$lead['title']);
    $body=trim((string)($lead['note']??''));
    if (!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($title)>240||strlen($title)<4) throw new RuntimeException('crm_validation');
    $phone=trim((string)($lead['phone']??''));
    $ref=substr(hash_hmac('sha256', $email.'|'.$title, $token),0,18);
    $key=hash_hmac('sha256','zmg-crm-'.$email.'|'.$title,$token);
    $file=sys_get_temp_dir().'/zmg_crm_'.substr($key,0,48).'.json';
    $lock=@fopen($file,'c+');
    if (!$lock||!flock($lock,LOCK_EX)) throw new RuntimeException('crm_lock');
    try {
        @chmod($file,0600);
        rewind($lock);$current=stream_get_contents($lock);
        $state=json_decode((string)$current,true);
        if (!is_array($state)||($state['time']??0)<time()-86400*7) $state=['time'=>time()];
        if (!empty($state['lead_id'])) return ['ref'=>$ref,'id'=>$state['lead_id'],'duplicate'=>true];
        if (empty($state['person_id'])) {
            $person=['name'=>$name,'emails'=>[['value'=>$email,'primary'=>true]]];
            if ($phone!=='')$person['phones']=[['value'=>$phone,'primary'=>true]];
            $res=zmg_crm_request('/api/v2/persons',$person,$token);
            $personId=(int)($res['id']??0);
            if ($personId<1)throw new RuntimeException('crm_person_missing');
            $state['person_id']=$personId;
            rewind($lock);ftruncate($lock,0);fwrite($lock,json_encode($state));fflush($lock);
        }
        $res=zmg_crm_request('/api/v1/leads',['title'=>$title,'person_id'=>(int)$state['person_id']],$token);
        $leadId=(string)($res['id']??'');
        if ($leadId==='')throw new RuntimeException('crm_lead_missing');
        $state['lead_id']=$leadId;
        rewind($lock);ftruncate($lock,0);fwrite($lock,json_encode($state));fflush($lock);
        if ($body!=='') {
            $note=htmlspecialchars($body,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');
            try { zmg_crm_request('/api/v1/notes',['lead_id'=>$leadId,'content'=>nl2br($note,false)],$token); }
            catch(Throwable $e) { /* Lead is accepted; notes can be manually enriched. */ }
        }
        return ['ref'=>$ref,'id'=>$leadId,'duplicate'=>false];
    } finally { flock($lock,LOCK_UN);fclose($lock); }
}
