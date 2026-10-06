# SISCOP - Sistema de Controle Operacional
Praça de Esportes Pref. Alvarim Vieira Rios • Pouso Alegre - MG

Plataforma completa para gestão de:
- **GDA:** Emissão e impressão de carteirinhas de associados (Plano Familiar, Individual, Especial, Convênios) e relatórios oficiais.
- **GID:** Gestão de identificação, ficha cadastral do associado, histórico de pagamentos, agendamento de quiosques de churrasqueira e calculadora de acertos.
- **POP:** Manual oficial de procedimentos operacionais padrão e diretrizes da Secretaria de Esportes.

---

## Como Rodar Localmente

1. Certifique-se de ter o **Node.js** (versão 18 ou superior) instalado em seu computador.
2. Abra o terminal na pasta deste projeto e execute:
```bash
npm install
```
3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
4. Acesse no seu navegador: `http://localhost:3000` ou o link exibido no terminal.

---

## Como Fazer Deploy

### 1. GitHub
```bash
git init
git add .
git commit -m "Deploy inicial do SISCOP"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/siscop.git
git push -u origin main
```

### 2. Vercel
- Conecte seu repositório GitHub na [Vercel](https://vercel.com).
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Clique em **Deploy**.

### 3. Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Selecione 'dist' como diretório público e configure como SPA (Yes)
npm run build
firebase deploy
```
