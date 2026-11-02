import {defineConfig} from 'vite';

export default defineConfig({
 build:{
  // Mantém o diretório publicado pelo serviço já existente no Render.
  outDir:'../dist',
  emptyOutDir:true
 }
});
