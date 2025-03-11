const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// 1) IMPORT DI TFJS-NODE
const tf = require('@tensorflow/tfjs-node');

// (Opzionale) Array con i nomi delle classi, se vuoi mappare indice → stringa
// Assicurati che l'ordine rispecchi quello usato in training.
const classNames = [
  'Carta1', 'Carta2', /* ... */, 'Carta31'
];

// Carica il modello TENSORFLOW.JS all'avvio (una volta sola).
// Adatta il percorso a dove hai collocato la cartella con model.json e i .bin.
let model;
(async () => {
  try {
    const modelPath = 'file://' + path.join(__dirname, 'model', 'model.json');
    model = await tf.loadGraphModel(modelPath);
    console.log('✅ Modello TFJS caricato con successo!');
  } catch (err) {
    console.error('❌ Errore nel caricamento del modello:', err);
  }
})();

// Funzione di inferenza: legge un file immagine, lo converte in tensor e predice
async function predictImage(filePath) {
  // 1) Leggi file come buffer
  const imageBuffer = fs.readFileSync(filePath);

  // 2) Decodifica in tensor
  const decoded = tf.node.decodeImage(imageBuffer, 3); // 3 canali (RGB)

  // 3) Ridimensiona a 224x224 (se il tuo modello si aspetta 224x224)
  const resized = tf.image.resizeBilinear(decoded, [224, 224]);

  // 4) Normalizza e aggiunge dimensione batch [1, 224, 224, 3]
  const normalized = resized.div(255).expandDims(0);

  // 5) Predici
  const predictions = model.predict(normalized);
  const data = predictions.dataSync(); // array di probabilità per ciascuna classe

  // 6) Trova indice con probabilità massima
  let maxIndex = 0;
  let maxVal = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i] > maxVal) {
      maxIndex = i;
      maxVal = data[i];
    }
  }

  // 7) Mappa indice → nome classe (se hai definito classNames)
  const predictedClass = classNames[maxIndex] || `Classe_${maxIndex}`;
  
  return {
    classIndex: maxIndex,
    className: predictedClass,
    probability: maxVal
  };
}


// =============== CODICE SERVER HTTPS ===============

const app = express();

// Percorsi dei certificati SSL
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

// Endpoint /upload -> riceve un'immagine in Base64 e fa inferenza
app.post('/upload', async (req, res) => {
  try {
    // 1) Prende l'immagine dal body
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // 2) Controlla sia in dataURL base64
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

    // 3) Controllo dimensione
    if (imageBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image is too large' });
    }

    // 4) Estensione file in base al MIME
    let extension = '.png';
    if (mimeType === 'image/jpeg') {
      extension = '.jpg';
    }

    // 5) Genera nome univoco e salva su disco in cartella uploads
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = 'image_' + Date.now() + extension;
    const filePath = path.join(uploadDir, fileName);

    // 6) Scrive il file su disco e poi fa inferenza
    fs.writeFile(filePath, imageBuffer, async (err) => {
      if (err) {
        console.error('Error saving image:', err);
        return res.status(500).json({ error: 'Error saving image' });
      }

      // (Facoltativo) Pausa di 4 secondi, come da tuo esempio:
      const startTime = Date.now();
      while (Date.now() - startTime < 4000) {
        // attesa bloccante (non consigliabile in produzione)
      }

      try {
        // 7) Esegui inferenza sul file appena salvato
        const result = await predictImage(filePath);

        // 8) Rispondi con il risultato (nome classe, probabilità, ecc.)
        return res.json({
          className: result.className,
          probability: result.probability
        });
      } catch (inferenceError) {
        console.error('Error during inference:', inferenceError);
        return res.status(500).json({ error: 'Error during inference' });
      }
    });

  } catch (error) {
    console.error('Error processing upload:', error);
    return res.status(500).json({ error: 'Internal server error' });
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
