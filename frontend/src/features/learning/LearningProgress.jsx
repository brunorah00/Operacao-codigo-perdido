import React from 'react';
import {learningMessage} from './progress.js';
export function LearningProgress({record,run}){
 return <section className="learning-progress" aria-label="Sua evolução neste setor"><strong>Sua evolução</strong><p>{learningMessage(record,run)}</p><small>Comparação pessoal entre conclusões deste setor, com os mesmos desafios, neste navegador.</small></section>;
}
