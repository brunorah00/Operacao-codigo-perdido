import test from 'node:test';
import assert from 'node:assert/strict';
import {recoveryLocation,recoveryRedirect,recoveryError,requestPasswordRecovery,updateRecoveredPassword} from '../src/services/password-recovery.js';

test('recovery intent survives SDK token consumption and detects expired links',()=>{
 assert.deepEqual(recoveryLocation('https://game.example/?recuperar=1'),{requested:true,invalid:false});
 assert.deepEqual(recoveryLocation('https://game.example/#type=recovery&access_token=test'),{requested:true,invalid:false});
 assert.deepEqual(recoveryLocation('https://game.example/?recuperar=1#error=access_denied&error_code=otp_expired'),{requested:true,invalid:true});
 assert.equal(recoveryLocation('https://game.example/#main').requested,false);
 assert.equal(recoveryRedirect('https://game.example/?old=1#main'),'https://game.example/?recuperar=1');
});
test('request uses email and the current site only, without profile lookups or admin credentials',async()=>{
 const client={auth:{resetPasswordForEmail:async(email,options)=>{assert.equal(email,'professor@example.com');assert.deepEqual(options,{redirectTo:'https://game.example/?recuperar=1'});return {};}}};
 await requestPasswordRecovery(client,' PROFESSOR@EXAMPLE.COM ','https://game.example/');
 await assert.rejects(()=>requestPasswordRecovery({auth:{resetPasswordForEmail:async()=>({error:{code:'over_email_send_rate_limit'}})}},'a@example.com','https://game.example/'),{code:'over_email_send_rate_limit'});
});
test('new password needs eight characters and updates only the authenticated password',async()=>{
 const calls=[];const client={auth:{updateUser:async args=>{calls.push(args);return {};}}};
 await assert.rejects(()=>updateRecoveredPassword(client,'short'),{code:'weak_password'});assert.equal(calls.length,0);
 await updateRecoveredPassword(client,'nova-senha-123');assert.deepEqual(calls,[{password:'nova-senha-123'}]);
 await assert.rejects(()=>updateRecoveredPassword({auth:{updateUser:async()=>({error:{name:'AuthSessionMissingError'}})}},'nova-senha-123'),{name:'AuthSessionMissingError'});
});
test('expected auth failures have actionable Portuguese messages',()=>{
 assert.match(recoveryError({code:'otp_expired'}),/Solicite um novo link/);
 assert.match(recoveryError({status:429}),/Aguarde/);
 assert.match(recoveryError({code:'same_password'}),/diferente/);
 assert.match(recoveryError({message:'Failed to fetch'}),/internet/);
});
