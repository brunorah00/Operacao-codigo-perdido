export function connectionErrorMessage(error){
 const message=error?.message||'';
 if(/failed to fetch|fetch failed|networkerror|network request failed|ERR_NAME_NOT_RESOLVED/i.test(message)){
  return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet. Se o problema continuar, avise o responsável pelo jogo.';
 }
 return message||'Não foi possível entrar. Verifique sua conexão.';
}
