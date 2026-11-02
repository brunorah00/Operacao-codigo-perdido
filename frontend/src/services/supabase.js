import {createClient} from '@supabase/supabase-js';
import {recoveryLocation} from './password-recovery.js';
// Captura a intenção antes de o SDK consumir os parâmetros de autenticação.
export const passwordRecoveryEntry=typeof window==='undefined'?{requested:false,invalid:false}:recoveryLocation(window.location.href);
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase=url&&key?createClient(url,key):null;
