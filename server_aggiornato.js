const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const axios = require('axios');
const FormData = require('form-data'); // Import form-data package

// (Opzionale) Array con i nomi delle classi, se vuoi mappare indice → stringa
const classNames = [
  '10_FINNING', '11_SCHOOLING', '12_SPECIE CHIAVE', '13_IPNOSI', '14_CORALLIGENO',
  '15_BLOOM ALGALE', '16_CANYON SOTTOMARINI', '17_NEVE MARINA', '18_BIOLUMINESCENZA',
  '19_FLUORESCENZA', '1_PERICOLO PLASTICA', '20_GIGANTISMO_ABISSALE', '21_SORGENTI IDROTERMALI',
  '22_DEEP SEA MINING', '23_WHALE FALL', '24_CARCINIZZAZIONE', '25_MIMETISMO AGGRESSIVO', '26_MIMETISMO CRIPTICO',
  '27_FILTRAZIONE', '28_TASSONOMO', '29_CACCIA CON L_ARPIONE', '2_POSIDONIETO', '30_SPECIE_ALIENE', '31_CAMBRIANO',
  '3_GALLEGGIAMENTO', '4_ELETTRORICEZIONE', '5_ECOLOCALIZZAZIONE', '6_BREACHING', '7_AMBIENTE ANTARTICO', '8_CLEPTOPREDAZIONE',
  '9_TAGGING'
];

const app = express();

// Percorsi dei certificati SSL per il server HTTPS Node.js
const options = {
  key: fs.readFileSync('C:\\prova_server\\server.key'),
  cert: fs.readFileSync('C:\\prova_server\\server.crt')
};

// Middleware per forzare HTTPS
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && req.protocol !== 'https') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// Servire file statici dalla cartella "public"
app.use(express.static(path.join(__dirname, 'public')));

// Rotte semplici
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/prova', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'prova.html'));
});

// Parsing JSON con limite 10MB (per immagini base64)
app.use(express.json({ limit: '10mb' }));

// Tipi di immagini ammessi
const allowedMimeTypes = ['image/jpeg', 'image/png'];

app.post('/upload', async (req, res) => {
  try {
    // 1) Prende l'immagine dal body
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // 2) Controlla che sia in formato dataURL Base64
    const matches = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image data' });
    }

    const mimeType = matches[1];
    if (!allowedMimeTypes.includes(mimeType)) {
      return res.status(400).json({ error: 'Unsupported image type' });
    }

    const base64Data = matches[2];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // 3) Controlla la dimensione dell'immagine
    if (imageBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image is too large' });
    }

    // 4) Determina l'estensione in base al MIME type
    let extension = '.png';
    if (mimeType === 'image/jpeg') {
      extension = '.jpg';
    }

    // 5) Genera un nome univoco e salva il file nella cartella "uploads"
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const fileName = 'image_' + Date.now() + extension;
    const filePath = path.join(uploadDir, fileName);

    // 6) Scrive il file su disco e poi effettua l'inferenza
    fs.writeFile(filePath, imageBuffer, async (err) => {
      if (err) {
        console.error('Error saving image:', err);
        return res.status(500).json({ error: 'Error saving image' });
      }

      // 7) Prepara la richiesta al server Python per l'inferenza
      try {
        const formData = new FormData();
        formData.append('image', fs.createReadStream(filePath));

        // Creazione di un https.Agent per accettare certificati self-signed
        const httpsAgent = new https.Agent({
          rejectUnauthorized: false
        });

        // Assumi che il server Python sia in esecuzione su https://localhost:5000
        const response = await axios.post('https://127.0.0.1:5000/predict', formData, {
          headers: formData.getHeaders(),
          httpsAgent
        });

        // Ritorna il risultato ottenuto dal server Python
        return res.json(response.data);
      } catch (error) {
        console.error('Error calling inference server:', error);
        return res.status(500).json({ error: 'Error during inference' });
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Unexpected error' });
  }
});

// Avvia server HTTPS sulla porta 443
https.createServer(options, app).listen(443, () => {
  console.log('✅ Server HTTPS in esecuzione sulla porta 443');
});

// Server HTTP su porta 80 che reindirizza a HTTPS
http.createServer((req, res) => {
  res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
  res.end();
}).listen(80, () => {
  console.log('🔄 Server HTTP in esecuzione sulla porta 80 (redirect a HTTPS)');
});
