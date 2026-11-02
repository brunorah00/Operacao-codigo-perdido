import React,{useEffect,useRef,useState} from 'react';
import {AudioControls,useAudioScene} from '../../audio/AudioProvider.jsx';
import {enterStudent,readStudent,verifyStudent,competitionError,STUDENT_SESSION_KEY} from '../../services/students.js';
import {supabase,passwordRecoveryEntry} from '../../services/supabase.js';
import {clearRecoveryLocation,recoveryError} from '../../services/password-recovery.js';
import {PasswordRecovery} from './PasswordRecovery.jsx';
import {connectionErrorMessage} from '../../services/connection-errors.js';
import {useCompetition} from '../competition/useCompetition.js';
import {RoomPicker} from '../competition/RoomPicker.jsx';
import {RoomDashboard} from '../competition/RoomDashboard.jsx';
function GameScenery(){return <div className="account-scenery" aria-hidden="true"><div className="account-scenery-shade"/></div>;}

export default function AccountGate({children}){
 const [session,setSession]=useState(null),[profile,setProfile]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [student,setStudent]=useState(()=>{try{return readStudent(window.localStorage);}catch{return null;}}),[verified,setVerified]=useState(''),[retry,setRetry]=useState(0);
 const [recovering,setRecovering]=useState(passwordRecoveryEntry.requested),[invalidRecovery,setInvalidRecovery]=useState(passwordRecoveryEntry.invalid);
 const [teacherRoom,setTeacherRoom]=useState(null),[entryRoom,setEntryRoom]=useState(''),[roomReady,setRoomReady]=useState(false);
 const selectedRoomId=session?teacherRoom?.id:student?.room_id;
 const {competition,error:competitionLoadError,missing,refresh,apply}=useCompetition(supabase,selectedRoomId);
 const registering=useRef(false);
 const [loginEmail,setLoginEmail]=useState(''),[mode,setMode]=useState('login'),[role,setRole]=useState('student'),[busy,setBusy]=useState(false);
 useAudioScene(!session&&!student?'login':null);
 const forgetStudent=()=>{try{localStorage.removeItem(STUDENT_SESSION_KEY);}catch{}setStudent(null);setVerified('');};
 useEffect(()=>{
  if(!supabase){setLoading(false);return;}
  let alive=true;
  supabase.auth.getSession().then(({data,error})=>{if(alive){setSession(data.session);setLoading(false);if(error)setError(passwordRecoveryEntry.requested?recoveryError(error):connectionErrorMessage(error));}}).catch(error=>{if(alive){setError(connectionErrorMessage(error));setLoading(false);}});
  const {data}=supabase.auth.onAuthStateChange((event,value)=>{if(alive&&!registering.current){if(event==='PASSWORD_RECOVERY'){setRecovering(true);setInvalidRecovery(false);setError('');}setSession(value);setProfile(null);}});
  return()=>{alive=false;data.subscription.unsubscribe();};
 },[]);
 useEffect(()=>{
  if(!session||recovering)return;
  let alive=true;
  const load=async()=>{try{const {data,error}=await supabase.from('profiles').select('*').eq('id',session.user.id).single();if(error)throw error;if(alive){setProfile(data);setError('');}}catch(error){if(alive)setError(connectionErrorMessage(error));}};
  void load();const timer=setInterval(load,15000);
  return()=>{alive=false;clearInterval(timer);};
 },[session,recovering]);
 useEffect(()=>{
  if(!student||!competition||session)return;
  if(student.competition_id!==competition.competition_id){forgetStudent();setNotice('O professor reiniciou sua sala. Entre novamente para começar do início.');return;}
  let alive=true;
  verifyStudent(supabase,student).then(data=>{if(alive){setStudent(data);setVerified(`${data.id}:${data.competition_id}`);setError('');}}).catch(error=>{
   if(!alive)return;
   if(error.code==='42501'){forgetStudent();setNotice('Sua sala foi excluída ou reiniciada, ou a sessão expirou. Escolha sua sala novamente na lista.');}
   else setError(competitionError(error));
  });
  return()=>{alive=false;};
 },[student?.id,student?.ranking_token,student?.competition_id,competition?.competition_id,session,retry]);
 useEffect(()=>{
  if(!missing)return;
  if(session)setTeacherRoom(null);else forgetStudent();
  setNotice('Esta sala foi excluída. Escolha outra sala para continuar.');
 },[missing,session]);
 const logout=async()=>{forgetStudent();setTeacherRoom(null);if(!session)return;setBusy(true);const {error}=await supabase.auth.signOut();if(error)setError(error.message);else{setProfile(null);setSession(null);}setBusy(false);};
 const finishRecovery=()=>{
  clearRecoveryLocation();forgetStudent();setTeacherRoom(null);setRecovering(false);setInvalidRecovery(false);setMode('login');setRole('teacher');setError('');setNotice('Senha atualizada com sucesso.');
 };
 const cancelRecovery=async()=>{
  setBusy(true);setError('');
  try{
   if(recovering&&session){const {error}=await supabase.auth.signOut({scope:'local'});if(error)throw error;setSession(null);setProfile(null);}
   clearRecoveryLocation();setRecovering(false);setInvalidRecovery(false);setRole('teacher');setMode('login');
  }catch(error){setError(recoveryError(error));}finally{setBusy(false);}
 };
 const submit=async event=>{
  event.preventDefault();setBusy(true);setError('');setNotice('');
  const form=new FormData(event.currentTarget),email=String(form.get('email')||'').trim().toLowerCase(),password=String(form.get('password')||'');
  const isSignup=role==='teacher'&&mode==='signup';
  if(isSignup)registering.current=true;
  try{
   if(role==='student'){
    const result=await enterStudent(supabase,{nickname:String(form.get('nickname')||''),roomId:entryRoom});
    try{localStorage.setItem(STUDENT_SESSION_KEY,JSON.stringify(result));}catch{}
    setStudent(result);setVerified(`${result.id}:${result.competition_id}`);return;
   }
   const result=isSignup?await supabase.auth.signUp({email,password,options:{data:{name:String(form.get('name')).trim(),role:'teacher'}}}):await supabase.auth.signInWithPassword({email,password});
   if(result.error)throw result.error;
   if(isSignup){
    if(result.data.session){const {error}=await supabase.auth.signOut({scope:'local'});if(error)throw error;}
    setSession(null);setProfile(null);setLoginEmail(email);setMode('login');
    setNotice('Cadastro de professor recebido. Confirme seu e-mail, se solicitado, e aguarde a aprovação do administrador.');
   }
  }catch(error){
   const messages={invalid_credentials:'E-mail ou senha incorretos.',email_not_confirmed:'Confirme o e-mail desta conta antes de entrar.',over_email_send_rate_limit:'O limite temporário de envio de e-mails foi atingido. Tente novamente mais tarde.'};
   setError(messages[error.code]||connectionErrorMessage(error));
  }finally{registering.current=false;setBusy(false);}
 };
 const panel=content=><main className="account-screen"><GameScenery/><section className="account-card"><AudioControls/><span className="eyebrow">OPERAÇÃO: CÓDIGO PERDIDO</span>{content}{error&&<p role="alert" className="feedback wrong">{error}</p>}</section></main>;
 if(!supabase)return panel(<><h1>Configurar conexão online</h1><p>Configure as variáveis do Supabase conforme backend/README.md.</p></>);
 if(loading)return panel(<p role="status">Carregando…</p>);
 if(recovering||mode==='forgot')return panel(<PasswordRecovery client={supabase} session={session} initialEmail={loginEmail} updating={recovering} invalid={invalidRecovery} onComplete={finishRecovery} onCancel={cancelRecovery} cancelling={busy}/>);
 if(selectedRoomId&&(!competition||missing))return panel(<><p role="status">{competitionLoadError||(missing?'Esta sala foi excluída.':'Conectando à sala…')}</p><button className="secondary" onClick={refresh}>Tentar novamente</button><button className="secondary" onClick={()=>session?setTeacherRoom(null):forgetStudent()}>Voltar à entrada</button></>);
 if(!session&&student){
  if(student.competition_id!==competition.competition_id||verified!==`${student.id}:${competition.competition_id}`)return panel(<><p role="status">Verificando sua entrada…</p><button onClick={()=>setRetry(value=>value+1)}>Tentar novamente</button><button onClick={logout}>Voltar à entrada</button></>);
  return children({profile:student,logout,onCompetitionReset:apply});
 }
 if(!session)return panel(<>
  <h1>{role==='teacher'&&mode==='signup'?'Cadastro de professor':'Bem-vindo, detetive.'}</h1>
  <p className="account-intro">{role==='student'?'Escolha sua sala na lista e informe seu nome ou apelido para jogar.':'Acesso de professores e administração.'}</p>
  <div className="account-role-switch" role="group" aria-label="Tipo de acesso">
   {[['student','Aluno'],['teacher','Professor / admin']].map(([value,label])=><button key={value} type="button" aria-pressed={role===value} disabled={busy} onClick={()=>{setRole(value);setMode('login');setError('');setNotice('');}}>{label}</button>)}
  </div>
  <p className="account-access-note">{role==='student'?'Use um nome ou apelido exclusivo na sala. Não é necessário cadastro, e-mail ou senha.':mode==='signup'?'Professores precisam da aprovação do administrador.':'Entre com seu e-mail e sua senha.'}</p>
  <form key={`${mode}-${role}`} onSubmit={submit}>
   {role==='student'?<>
    <RoomPicker value={entryRoom} onChange={setEntryRoom} onReadyChange={setRoomReady} disabled={busy}/>
    <label>Nome ou apelido<input name="nickname" autoComplete="nickname" placeholder="Como você quer aparecer no ranking?" required minLength={2} maxLength={120}/></label></>:<>
    {mode==='signup'&&<label>Seu nome<input name="name" autoComplete="name" required minLength={2} maxLength={120}/></label>}
    <label>E-mail<input value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} name="email" type="email" autoComplete="email" required/></label>
    <label>Senha<input name="password" type="password" minLength={mode==='signup'?8:undefined} autoComplete={mode==='signup'?'new-password':'current-password'} required/></label>
   </>}
   <button className="primary account-submit" disabled={busy||(role==='student'&&!roomReady)}>{busy?'Aguarde…':role==='student'?'Entrar na sala':mode==='signup'?'Cadastrar professor':'Entrar'}<span aria-hidden="true">→</span></button>
  </form>
  {role==='teacher'&&mode==='login'&&<button type="button" className="password-link" disabled={busy} onClick={()=>{setMode('forgot');setError('');setNotice('');}}>Esqueci minha senha</button>}
  {notice&&<p className="account-notice" role="status">{notice}</p>}
  {role==='teacher'&&<div className="account-mode-switch"><span>{mode==='signup'?'Já tem cadastro?':'Primeiro acesso como professor?'}</span><button type="button" disabled={busy} onClick={()=>{setMode(mode==='signup'?'login':'signup');setError('');setNotice('');}}>{mode==='signup'?'Voltar para entrar':'Cadastrar professor'}</button></div>}
 </>);
 if(!profile)return panel(<><p role="status">Carregando perfil…</p><button disabled={busy} onClick={logout}>Sair</button></>);
 if(!['teacher','admin'].includes(profile.role))return panel(<><p>Para jogar como aluno, saia e entre com um apelido.</p><button onClick={logout}>Sair</button></>);
 if(profile.status!=='active')return panel(<><h1>{profile.status==='pending'?'Aguardando aprovação':profile.status==='rejected'?'Cadastro recusado':'Acesso revogado'}</h1><p>O acesso de professor depende da liberação do administrador.</p><button disabled={busy} onClick={logout}>Sair</button></>);
 if(!teacherRoom)return panel(<>{notice&&<p role="status">{notice}</p>}<RoomDashboard profile={profile} onEnter={setTeacherRoom} onLogout={logout}>{profile.role==='admin'&&<TeacherRequests/>}</RoomDashboard></>);
 return children({profile:{...profile,room_id:competition.id,room_name:competition.name,room_code:teacherRoom.join_code,competition_id:competition.competition_id},logout,onCompetitionReset:apply,onLeaveRoom:()=>setTeacherRoom(null)});
}
function TeacherRequests(){
 const [rows,setRows]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const load=async()=>{const {data,error}=await supabase.from('profiles').select('id,name,email,status').eq('role','teacher').order('created_at');if(error)setError(error.message);else setRows(data);};
 useEffect(()=>{void load();},[]);
 const review=async(id,decision)=>{setBusy(true);setError('');try{const {error}=await supabase.rpc('review_teacher',{teacher_id:id,decision});if(error)throw error;await load();}catch(err){setError(err.message);}finally{setBusy(false);}};
 return <><button disabled={busy} onClick={load}>Atualizar solicitações</button>{error&&<p role="alert">{error}</p>}{!rows.length&&<p>Nenhum professor cadastrado.</p>}{rows.map(row=><article className="teacher-request" key={row.id}><strong>{row.name}</strong><p>{row.email}</p><p>Status: {({pending:'Pendente',active:'Aprovado',rejected:'Recusado',revoked:'Revogado'})[row.status]}</p><div className="account-actions">{row.status!=='active'&&<button disabled={busy} onClick={()=>review(row.id,'active')}>Aprovar</button>}{row.status==='pending'&&<button disabled={busy} onClick={()=>review(row.id,'rejected')}>Recusar</button>}{row.status==='active'&&<button disabled={busy} onClick={()=>review(row.id,'revoked')}>Revogar acesso</button>}</div></article>)}</>;
}
