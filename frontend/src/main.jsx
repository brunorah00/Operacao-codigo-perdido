import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import {AudioProvider} from './audio/AudioProvider.jsx';
import AccountGate from './features/auth/AccountGate.jsx';
import './features/auth/auth.css';
import './styles.css';
import './arcade.css';
import './play.css';

createRoot(document.getElementById('root')).render(<AudioProvider><AccountGate>{({profile,logout,onCompetitionReset})=><App key={`${profile.id}:${profile.competition_id}`} account={profile} onLogout={logout} onCompetitionReset={onCompetitionReset}/>}</AccountGate></AudioProvider>);
