import test from 'node:test';
import assert from 'node:assert/strict';
import {enterStudent,readStudent,verifyStudent,listStudentRooms} from '../src/services/students.js';
const profile={id:'student-id',name:'Robo Azul',role:'student',status:'active',room_id:'room-1',room_name:'Turma A',competition_id:'round-1',ranking_token:'private-token'};
test('Student enters with a selected room and nickname, without email, password or Auth',async()=>{
 const client={rpc:async(name,args)=>{assert.equal(name,'join_school_room');assert.deepEqual(args,{nickname:'Robo Azul',p_room_id:'room-1'});return {data:profile};}};
 assert.deepEqual(await enterStudent(client,{nickname:'  Robo Azul  ',roomId:'room-1'}),profile);
});
test('Nickname access reports the current migration and rejects malformed identities',async()=>{
 await assert.rejects(()=>enterStudent({rpc:async()=>({error:{code:'PGRST202'}})},{nickname:'Ana',roomId:'room-1'}),/202611020004/);
 await assert.rejects(()=>enterStudent({rpc:async()=>({data:{...profile,role:'admin'}})},{nickname:'Ana',roomId:'room-1'}),/perfil do aluno/);
});
test('Saved student sessions require a competition and session token',()=>{
 for(const value of ['broken','null',JSON.stringify({...profile,role:'admin'}),JSON.stringify({id:'old',name:'Aluno',role:'student',status:'active'})])assert.equal(readStudent({getItem:()=>value}),null);
 assert.deepEqual(readStudent({getItem:()=>JSON.stringify(profile)}),profile);
 assert.equal(readStudent({getItem(){throw Error('denied');}}),null);
});
test('Server verifies saved sessions before restoring access',async()=>{
 const client={rpc:async(name,args)=>{assert.equal(name,'get_competition_student');assert.deepEqual(args,{p_player_id:profile.id,p_student_token:profile.ranking_token,p_competition_id:profile.competition_id});return {data:profile};}};
 assert.deepEqual(await verifyStudent(client,profile),profile);
 await assert.rejects(()=>verifyStudent({rpc:async()=>({error:{code:'42501',message:'Reset'}})},profile),{code:'42501'});
});

test('students cannot enter without selecting a room',async()=>{
 let called=false;
 await assert.rejects(()=>enterStudent({rpc:async()=>{called=true;}},{nickname:'Ana',roomId:''}),/Escolha uma sala/);
 assert.equal(called,false);
});
test('public room list returns room and teacher names and reports failures',async()=>{
 const rooms=[{id:'room-1',name:'Turma A',teacher_name:'Professora Ana'}];
 assert.deepEqual(await listStudentRooms({rpc:async name=>{assert.equal(name,'available_school_rooms');return {data:rooms};}}),rooms);
 assert.deepEqual(await listStudentRooms({rpc:async()=>({data:[]})}),[]);
 await assert.rejects(()=>listStudentRooms({rpc:async()=>({error:{code:'PGRST202'}})}),/202611020004/);
});
