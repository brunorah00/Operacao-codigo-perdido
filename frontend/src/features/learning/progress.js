export function readLearning(value,levels){
 if(!Array.isArray(value))return [];
 const integer=n=>Number.isInteger(n)&&n>=0;
 return Array.from({length:levels},(_,i)=>{
  const item=value[i];
  return item&&integer(item.attempts)&&item.attempts>0&&integer(item.lastCommands)&&integer(item.bestCommands)&&item.bestCommands<=item.lastCommands&&(item.previousCommands===null||integer(item.previousCommands))?{attempts:item.attempts,lastCommands:item.lastCommands,previousCommands:item.previousCommands,bestCommands:item.bestCommands}:null;
 });
}
export function recordLearning(previous,before,after){
 const records=readLearning(previous,after.length);
 after.forEach((run,index)=>{
  if(!run.completed||before[index]?.completed)return;
  const old=records[index];
  records[index]={attempts:(old?.attempts||0)+1,previousCommands:old?.lastCommands??null,lastCommands:run.commands,bestCommands:Math.min(old?.bestCommands??run.commands,run.commands)};
 });
 return records;
}
export function learningMessage(record,run){
 if(!record)return run.completed?`Primeira conclusão: ${run.commands} comandos. Você já tem uma referência para a próxima tentativa!`:'Conclua este setor para registrar sua primeira referência pessoal.';
 if(!run.completed)return `Última conclusão: ${record.lastCommands} comandos. Sua melhor marca: ${record.bestCommands}. Experimente um caminho mais eficiente!`;
 // O efeito que salva o progresso pode ainda não ter registrado a conclusão.
 const previous=record.lastCommands===run.commands?record.previousCommands:record.lastCommands;
 if(previous===null)return `Primeira conclusão: ${run.commands} comandos. Você já tem uma referência para a próxima tentativa!`;
 const difference=previous-run.commands;
 if(difference>0)return `Você concluiu com ${difference} comando${difference===1?'':'s'} a menos que na tentativa anterior! (${previous} → ${run.commands})`;
 if(difference===0)return `Você manteve sua eficiência: ${run.commands} comandos, como na conclusão anterior. Que outro caminho pode testar?`;
 return `Setor concluído com ${run.commands} comandos. Na conclusão anterior foram ${previous}. Revise os giros e as repetições na próxima tentativa.`;
}
