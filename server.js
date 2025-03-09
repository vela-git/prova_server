const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const app = express();

// Percorsi dei certificati SSL
const options = {
  key: fs.readFileSync('C:\\Users\\corag_k2xtjcg\\Desktop\\TheSip\\prova\\prova_server\\server.key'),
  cert: fs.readFileSync('C:\\Users\\corag_k2xtjcg\\Desktop\\TheSip\\prova\\prova_server\\server.crt')
};

// Middleware per forzare HTTPS (funziona anche con proxy)
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && req.protocol !== 'https') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// Servire file statici dalla cartella "public"
app.use(express.static(path.join(__dirname, 'public')));

// Rotte
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/prova', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'prova.html'));
});

// Avvia il server HTTPS
https.createServer(options, app).listen(443, () => {
  console.log('✅ Server HTTPS in esecuzione sulla porta 443');
});

// Server HTTP per reindirizzare tutto a HTTPS
http.createServer((req, res) => {
  res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
  res.end();
}).listen(80, () => {
  console.log('🔄 Server HTTP in esecuzione sulla porta 80 (reindirizza a HTTPS)');
});
