import test from 'node:test';
import assert from 'node:assert/strict';
import {enterStudent,readStudent} from '../src/services/students.js';

test('Student registration normalizes email and never sends a password or calls Auth',async()=>{
 const profile={id:'student-id',name:'Maria Eloisa',role:'student',status:'active'};
 const client={rpc:async(name,args)=>{assert.equal(name,'enter_student');assert.deepEqual(args,{student_name:'Maria Eloisa',student_email:'eloisa@example.com',create_account:true});return {data:profile};}};
 assert.deepEqual(await enterStudent(client,{name:' Maria Eloisa ',email:' ELOISA@EXAMPLE.COM ',createAccount:true}),profile);
});
test('Student login only resumes existing students and preserves migration errors',async()=>{
 const client={rpc:async(_name,args)=>{assert.equal(args.create_account,false);assert.equal(args.student_name,'');return {error:{code:'PGRST202'}};}};
 await assert.rejects(()=>enterStudent(client,{email:'aluno@example.com'}),/202610140002/);
 await assert.rejects(()=>enterStudent({rpc:async()=>({data:{id:'admin',name:'Admin',role:'admin',status:'active'}})},{email:'admin@example.com'}),/perfil do aluno/);
});
test('Local student identity rejects malformed data and other roles',()=>{
 for(const value of ['broken',JSON.stringify({id:'x',name:'Admin',role:'admin',status:'active'}),'null'])assert.equal(readStudent({getItem:()=>value}),null);
 const profile={id:'x',name:'Aluno',role:'student',status:'active'};
 assert.deepEqual(readStudent({getItem:()=>JSON.stringify(profile)}),profile);
 assert.equal(readStudent({getItem(){throw Error('denied');}}),null);
});
