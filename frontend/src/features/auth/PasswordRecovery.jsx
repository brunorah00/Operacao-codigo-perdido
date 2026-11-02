import React,{useState} from 'react';
import {requestPasswordRecovery,updateRecoveredPassword,recoveryError} from '../../services/password-recovery.js';
export function PasswordRecovery({client,session,initialEmail='',updating=false,invalid=false,onComplete,onCancel,cancelling=false}){
 const [email,setEmail]=useState(initialEmail||session?.user?.email||''),[password,setPassword]=useState(''),[show,setShow]=useState(false),[sent,setSent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[requestNew,setRequestNew]=useState(false);
 const canUpdate=updating&&session&&!invalid&&!requestNew;
 const submit=async event=>{
  event.preventDefault();if(busy)return;setBusy(true);setError('');
  try{
   if(canUpdate){await updateRecoveredPassword(client,password);onComplete();}
   else{await requestPasswordRecovery(client,email,window.location.href);setSent(true);}
  }catch(error){setError(recoveryError(error));}finally{setBusy(false);}
 };
 return <div className="password-recovery"><h1>{canUpdate?'Defina sua nova senha':'Recuperar senha'}</h1>
  {canUpdate?<><p>Escolha uma senha com pelo menos 8 caracteres para {session.user.email}.</p><form onSubmit={submit}>
   <label>Nova senha<input name="newPassword" type={show?'text':'password'} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required disabled={busy}/></label>
   <button className="password-link" type="button" aria-pressed={show} onClick={()=>setShow(value=>!value)}>{show?'Ocultar senha':'Mostrar senha'}</button>
   <button className="primary account-submit" disabled={busy||cancelling}>{busy?'Salvando…':'Salvar nova senha'}</button>
  </form><button className="password-link" onClick={()=>{setRequestNew(true);setError('');setSent(false);}} disabled={busy||cancelling}>Preciso de outro link</button></>:<>
   {updating&&<p>O link expirou, já foi usado ou não está disponível. Informe seu e-mail para receber um novo.</p>}
   {!updating&&<p>Informe o e-mail do seu cadastro de professor. Você receberá um link para escolher outra senha.</p>}
   {sent?<p className="account-notice" role="status">Se o e-mail estiver cadastrado, você receberá um link para criar sua nova senha. Confira também o spam.</p>:<form onSubmit={submit}>
    <label>E-mail<input name="recoveryEmail" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required disabled={busy}/></label>
    <button className="primary account-submit" disabled={busy||cancelling}>{busy?'Enviando…':'Enviar link de recuperação'}</button>
   </form>}
  </>}
  {error&&<p role="alert" className="feedback wrong">{error}</p>}
  <button className="secondary" disabled={busy||cancelling} onClick={onCancel}>{cancelling?'Aguarde…':'Voltar para entrar'}</button>
 </div>;
}
