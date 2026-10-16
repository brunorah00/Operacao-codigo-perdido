import React,{useEffect,useRef,useState} from 'react';
import {AudioControls,useAudioScene} from '../../audio/AudioProvider.jsx';
import {enterStudent,readStudent,STUDENT_SESSION_KEY} from '../../services/students.js';
import {supabase} from '../../services/supabase.js';
function GameScenery(){
 return <div className="account-scenery" aria-hidden="true"><div className="account-scenery-shade"/></div>;
}

export default function AccountGate({children}){
 const [session,setSession]=useState(null),[profile,setProfile]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [student,setStudent]=useState(()=>{try{return readStudent(window.localStorage);}catch{return null;}});
 useAudioScene(!session&&!student?'login':'silent');
 const registering=useRef(false);
 const [loginEmail,setLoginEmail]=useState('');
 const [mode,setMode]=useState('login'),[role,setRole]=useState('student'),[busy,setBusy]=useState(false);
 useEffect(()=>{
  if(!supabase){setLoading(false);return;}
  let alive=true;
  supabase.auth.getSession().then(({data,error})=>{if(alive){setSession(data.session);setLoading(false);if(error)setError(error.message);}});
  const {data}=supabase.auth.onAuthStateChange((_event,value)=>{if(alive&&!registering.current){setSession(value);setProfile(null);}});
  return()=>{alive=false;data.subscription.unsubscribe();};
 },[]);
 useEffect(()=>{
  if(!session)return;
  let alive=true;
  const load=async()=>{const {data,error}=await supabase.from('profiles').select('*').eq('id',session.user.id).single();if(alive){setProfile(data);setError(error? 'Não foi possível carregar sua conta. Verifique a conexão e a configuração do backend.':'');}};
  void load();const timer=setInterval(load,15000);
  return()=>{alive=false;clearInterval(timer);};
 },[session]);
 const logout=async()=>{try{localStorage.removeItem(STUDENT_SESSION_KEY);}catch{}setStudent(null);if(!session)return;setBusy(true);const {error}=await supabase.auth.signOut();if(error)setError(error.message);else{setProfile(null);setSession(null);}setBusy(false);};
 const submit=async event=>{
  event.preventDefault();setBusy(true);setError('');setNotice('');
  const form=new FormData(event.currentTarget),email=String(form.get('email')).trim().toLowerCase(),password=String(form.get('password')||'');
  const isSignup=mode==='signup';
  if(isSignup&&role==='teacher')registering.current=true;
  try{
   if(role==='student'){
    const result=await enterStudent(supabase,{name:String(form.get('name')||''),email,createAccount:isSignup});
    if(isSignup){setLoginEmail(email);setMode('login');setNotice('Aluno cadastrado! Entre com seu e-mail, sem senha.');}
    else{try{localStorage.setItem(STUDENT_SESSION_KEY,JSON.stringify(result));}catch{}setStudent(result);}
    return;
   }
   const result=mode==='signup'?await supabase.auth.signUp({email,password,options:{data:{name:String(form.get('name')).trim(),role}}}):await supabase.auth.signInWithPassword({email,password});
   if(result.error)throw result.error;
   if(isSignup){
    if(result.data.session){const {error}=await supabase.auth.signOut({scope:'local'});if(error)throw error;}
    setSession(null);setProfile(null);setLoginEmail(email);setMode('login');
    setNotice(role==='teacher'?'Cadastro de professor recebido. Confirme seu e-mail, se solicitado, e aguarde a aprovação do administrador.':'Cadastro realizado! Confirme seu e-mail, se solicitado, e entre com sua senha.');
   }
  }catch(err){
   const messages={invalid_credentials:'E-mail ou senha incorretos. Para administrador, selecione Professor / administrador e use a senha da conta.',email_not_confirmed:'Confirme o e-mail desta conta antes de entrar.',over_email_send_rate_limit:'O limite temporário de envio de e-mails foi atingido. Tente novamente mais tarde.'};
   setError(messages[err.code]||err.message||'Não foi possível entrar. Verifique sua conexão.');
  }finally{registering.current=false;setBusy(false);}
 };
 const panel=content=><main className="account-screen"><GameScenery/><section className="account-card"><AudioControls/><span className="eyebrow">OPERAÇÃO: CÓDIGO PERDIDO</span>{content}{error&&<p role="alert" className="feedback wrong">{error}</p>}</section></main>;
 if(!supabase)return panel(<><h1>Configurar conexão online</h1><p>Configure as variáveis do Supabase conforme BACKEND.md para ativar cadastros e acesso ao jogo.</p></>);
 if(loading)return panel(<p role="status">Carregando…</p>);
 if(!session&&student)return children({profile:student,logout});
 if(!session)return panel(<>
  <h1>{mode==='signup'?'Comece sua investigação':'Bem-vindo, detetive.'}</h1>
  <p className="account-intro">{mode==='signup'?'Crie seu perfil para participar da missão.':'Entre para continuar sua missão.'}</p>
  <div className="account-role-switch" role="group" aria-label="Tipo de acesso">
   {[['student','Aluno'],['teacher','Professor / admin']].map(([value,label])=><button key={value} type="button" aria-pressed={role===value} disabled={busy} onClick={()=>{setRole(value);setError('');setNotice('');}}>{label}</button>)}
  </div>
  <p className="account-access-note">{role==='student'?'Acesso do aluno sem senha.':mode==='signup'?'Professores precisam da aprovação do administrador.':'Acesso com senha para professores e administrador.'}</p>
  <form key={`${mode}-${role}`} onSubmit={submit}>
   {mode==='signup'&&<label>Seu nome<input name="name" autoComplete="name" placeholder="Como você se chama?" required minLength={2} maxLength={120}/></label>}
   <label>E-mail<input defaultValue={loginEmail} name="email" type="email" placeholder="seuemail@exemplo.com" autoComplete="email" required/></label>
   {role==='teacher'&&<label>Senha<input name="password" type="password" placeholder={mode==='signup'?'Crie uma senha com pelo menos 8 caracteres':'Digite sua senha'} minLength={mode==='signup'?8:undefined} autoComplete={mode==='signup'?'new-password':'current-password'} required/></label>}
   <button className="primary account-submit" disabled={busy}>{busy?'Aguarde…':mode==='signup'?'Criar minha conta':'Entrar'}<span aria-hidden="true">→</span></button>
  </form>
  {notice&&<p className="account-notice" role="status">{notice}</p>}
  <div className="account-mode-switch"><span>{mode==='signup'?'Já tem uma conta?':'Primeira vez por aqui?'}</span><button type="button" disabled={busy} onClick={()=>{setMode(mode==='signup'?'login':'signup');setError('');setNotice('');}}>{mode==='signup'?'Voltar para entrar':'Criar conta'}</button></div>
 </>);
 if(!profile)return panel(<><p role="status">Carregando perfil…</p><button disabled={busy} onClick={logout}>Sair</button></>);
 if(profile.role==='admin')return panel(<><h1>Administração</h1><TeacherRequests/><button disabled={busy} onClick={logout}>Sair</button></>);
 if(profile.status!=='active')return panel(<><h1>{profile.status==='pending'?'Aguardando aprovação':profile.status==='rejected'?'Cadastro recusado':'Acesso revogado'}</h1><p>O acesso de professor depende da liberação do administrador. Esta tela verifica seu status automaticamente.</p><button disabled={busy} onClick={logout}>Sair</button></>);
 return children({profile,logout});
}
function TeacherRequests(){
 const [rows,setRows]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const load=async()=>{const {data,error}=await supabase.from('profiles').select('id,name,email,status').eq('role','teacher').order('created_at');if(error)setError(error.message);else setRows(data);};
 useEffect(()=>{void load();},[]);
 const review=async(id,decision)=>{setBusy(true);setError('');try{const {error}=await supabase.rpc('review_teacher',{teacher_id:id,decision});if(error)throw error;await load();}catch(err){setError(err.message);}finally{setBusy(false);}};
 return <><button disabled={busy} onClick={load}>Atualizar solicitações</button>{error&&<p role="alert">{error}</p>}{!rows.length&&<p>Nenhum professor cadastrado.</p>}{rows.map(row=><article className="teacher-request" key={row.id}><strong>{row.name}</strong><p>{row.email}</p><p>Status: {({pending:'Pendente',active:'Aprovado',rejected:'Recusado',revoked:'Revogado'})[row.status]}</p><div className="account-actions">{row.status!=='active'&&<button disabled={busy} onClick={()=>review(row.id,'active')}>Aprovar</button>}{row.status==='pending'&&<button disabled={busy} onClick={()=>review(row.id,'rejected')}>Recusar</button>}{row.status==='active'&&<button disabled={busy} onClick={()=>review(row.id,'revoked')}>Revogar acesso</button>}</div></article>)}</>;
}
