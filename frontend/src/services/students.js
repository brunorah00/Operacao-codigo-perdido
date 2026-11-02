export const STUDENT_SESSION_KEY='codigo-perdido-aluno-local-v1';
export const COMPETITION_MIGRATION='202611020002_nickname_competitions.sql';
export function competitionError(error){
 if(['PGRST202','PGRST205','42P01','42883'].includes(error?.code))return `Ative a competição no Supabase executando a migração ${COMPETITION_MIGRATION}.`;
 return error?.message||'Não foi possível conectar à competição. Verifique sua conexão.';
}
export function validStudent(p){return p&&typeof p.id==='string'&&typeof p.name==='string'&&p.role==='student'&&p.status==='active'&&typeof p.competition_id==='string'&&typeof p.ranking_token==='string';}
export async function enterStudent(client,{nickname}){
 const {data,error}=await client.rpc('enter_competition_student',{nickname:nickname.trim()});
 if(error)throw Error(competitionError(error));
 if(!validStudent(data))throw Error('Não foi possível abrir o perfil do aluno.');
 return data;
}
export async function verifyStudent(client,student){
 const {data,error}=await client.rpc('get_competition_student',{p_player_id:student.id,p_student_token:student.ranking_token,p_competition_id:student.competition_id});
 if(error)throw error;
 if(!validStudent(data))throw Error('Não foi possível validar sua entrada.');
 return data;
}
export function readStudent(storage){try{const p=JSON.parse(storage.getItem(STUDENT_SESSION_KEY));return validStudent(p)?p:null;}catch{return null;}}
