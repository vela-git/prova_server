const express = require('express');
const path = require('path');
const app = express();

// Per gestire i body in formato JSON (fino a 10MB di immagine)
app.use(express.json({ limit: '10mb' }));

// Servire i file statici (index.html, style.css, script.js) dalla cartella "public"
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint per ricevere l'immagine
app.post('/upload', async (req, res) => {
  try {
    // L'immagine è in base64 in req.body.image
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Nessuna immagine ricevuta' });
    }

    // Converte la base64 in buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // A questo punto potresti passare 'buffer' a un sistema di riconoscimento (OpenCV, CNN, ecc.)
    // Per ora facciamo un "fake" recognition:
    const recognizedCardName = "Tagging"; // mock

    // Rispondo con un oggetto JSON
    return res.json({
      cardName: recognizedCardName,
      description: "Esempio di carta fittizia con poteri marini."
    });

  } catch (error) {
    console.error("Errore durante l'upload:", error);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Avvio del server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
