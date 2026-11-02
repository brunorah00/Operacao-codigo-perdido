export function recoveryLocation(href){
 const url=new URL(href),hash=new URLSearchParams(url.hash.slice(1));
 return {requested:url.searchParams.get('recuperar')==='1'||hash.get('type')==='recovery',invalid:!!(hash.get('error')||url.searchParams.get('error'))};
}
export function recoveryRedirect(href){
 const url=new URL('/',href);url.searchParams.set('recuperar','1');return url.href;
}
export function clearRecoveryLocation(){
 const url=new URL(window.location.href);
 for(const key of ['recuperar','error','error_code','error_description'])url.searchParams.delete(key);
 const hash=new URLSearchParams(url.hash.slice(1));
 if(['access_token','refresh_token','type','error','error_code','error_description'].some(key=>hash.has(key)))url.hash='';
 window.history.replaceState(null,'',url.pathname+url.search+url.hash);
}
export function recoveryError(error){
 if(['over_email_send_rate_limit','over_request_rate_limit'].includes(error?.code)||error?.status===429)return 'Aguarde um pouco antes de pedir outro link.';
 if(error?.code==='same_password')return 'Escolha uma senha diferente da anterior.';
 if(error?.code==='weak_password')return 'Use uma senha com pelo menos 8 caracteres e siga os requisitos indicados pelo serviço.';
 if(['otp_expired','flow_state_expired','bad_code_verifier','session_not_found','refresh_token_not_found'].includes(error?.code)||error?.name==='AuthSessionMissingError')return 'O link expirou ou já foi usado. Solicite um novo link.';
 if(/failed to fetch|fetch failed|networkerror|network request failed/i.test(error?.message||''))return 'Não foi possível conectar. Confira sua internet e tente novamente.';
 return 'Não foi possível concluir. Tente novamente ou solicite um novo link.';
}
export async function requestPasswordRecovery(client,email,href){
 const {error}=await client.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:recoveryRedirect(href)});
 if(error)throw error;
}
export async function updateRecoveredPassword(client,password){
 if(password.length<8)throw Object.assign(new Error('Use pelo menos 8 caracteres.'),{code:'weak_password'});
 const {error}=await client.auth.updateUser({password});
 if(error)throw error;
}
