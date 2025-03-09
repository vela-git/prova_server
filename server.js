// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Indichiamo a Express di servire i file statici dalla cartella "public"
app.use(express.static(path.join(__dirname, 'public')));

/**
 * 1) Rotta per la "loadingPage"
 *    - Se un utente visita la root "/", gli inviamo loadingPage.html
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/prova', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'prova.html'));
});

/**
 * 2) Rotta per la "homepage"
 *    - Se un utente visita "/homepage", gli inviamo homepage.html
 */
app.get('/homepage', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'homepage.html'));
});

// Avviamo il server
app.listen(PORT, () => {
  console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
