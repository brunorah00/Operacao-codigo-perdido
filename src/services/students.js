export const STUDENT_SESSION_KEY='codigo-perdido-aluno-local-v1';
export async function enterStudent(client,{name='',email,createAccount=false}){
 const {data,error}=await client.rpc('enter_student',{student_name:name.trim(),student_email:email.trim().toLowerCase(),create_account:createAccount});
 if(error){
  if(error.code==='PGRST202')throw Error('O acesso de aluno precisa ser ativado no banco. Execute a migração 202610140002_students_without_password.sql no Supabase.');
  throw error;
 }
 if(!data?.id||!data?.name||data.role!=='student'||data.status!=='active')throw Error('Não foi possível abrir o perfil do aluno.');
 return data;
}
export function readStudent(storage){try{const p=JSON.parse(storage.getItem(STUDENT_SESSION_KEY));return p&&typeof p.id==='string'&&typeof p.name==='string'&&p.role==='student'&&p.status==='active'?p:null;}catch{return null;}}
