const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const app = express();

// Percorsi dei certificati SSL
const options = {
  key: fs.readFileSync('C:\\prova_server\\server.key'),
  cert: fs.readFileSync('C:\\prova_server\\server.crt')
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

// Limite a 10MB per il JSON (utile per immagini in base64)
app.use(express.json({ limit: '10mb' }));

// Tipi di immagini ammessi
const allowedMimeTypes = ['image/jpeg', 'image/png'];

app.post('/upload', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Verifica che l'immagine sia in formato Data URL
    const matches = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image data' });
    }

    const mimeType = matches[1];
    // Controlla se il MIME type è ammesso
    if (!allowedMimeTypes.includes(mimeType)) {
      return res.status(400).json({ error: 'Unsupported image type' });
    }

    // Converte il contenuto base64 in un buffer
    const imageBuffer = Buffer.from(matches[2], 'base64');

    // Ulteriore controllo sulla dimensione del file (per sicurezza)
    if (imageBuffer.length > 10 * 1024 * 1024) { // 10 MB
      return res.status(400).json({ error: 'Image is too large' });
    }

    // Determina l'estensione in base al MIME type
    let extension = '';
    if (mimeType === 'image/jpeg') {
      extension = '.jpg';
    } else if (mimeType === 'image/png') {
      extension = '.png';
    }

    // Genera un nome file univoco usando crypto
    const fileName = "image" + Date.now() + extension;
    const uploadDir = path.join(__dirname, 'uploads');

    // Crea la cartella uploads se non esiste
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);

    // Salva il file
    fs.writeFile(filePath, imageBuffer, err => {
      if (err) {
        console.error('Error saving image:', err);
        return res.status(500).json({ error: 'Error saving image' });
      }
      const startTime = Date.now();
      while (Date.now() - startTime < 4000) {}
      // Risposta con il nome file salvato (che puoi usare per visualizzare l'immagine)
      //return res.json({ cardName: fileName });
      return res.status(500).json({ error: 'Error saving image' });
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
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
