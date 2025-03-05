const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Percorso al file di pesi YOLO e allo script di inferenza
const YOLO_WEIGHTS = path.join(__dirname, 'best.pt');
const YOLO_SCRIPT = path.join(__dirname, 'detect_cards.py');

app.post('/upload', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Nessuna immagine' });

    const base64Data = image.replace(/^data:image\/\w+;base64,/, ''); // Rimuovi intestazione base64
    const buffer = Buffer.from(base64Data, 'base64');

    const tempPath = path.join(__dirname, 'temp.jpg');  // Salva su file temporaneo
    fs.writeFileSync(tempPath, buffer);

    const py = spawn('python', [YOLO_SCRIPT, YOLO_WEIGHTS, tempPath]);   // Esegui lo script Python: python detect_cards.py best.pt temp.jpg

    let resultData = '';
    let errorData = '';
    py.stdout.on('data', (data) => {
      resultData += data.toString();
    });

    py.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    py.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script error code:', code, errorData);
        return res.status(500).json({ error: 'Errore nello script Python', details: errorData });
      }
      try {
        const output = JSON.parse(resultData); // output è tipo { cardName: 'Carta3', confidence: 0.87 } 
        return res.json(output);
      } catch (parseErr) {
        console.error('Errore parsing JSON:', parseErr, resultData);
        return res.status(500).json({ error: 'Errore parse JSON', details: resultData });
      }
    });
    
  } catch (err) {
    console.error("Errore in /upload:", err);
    res.status(500).json({ error: "Errore del server" });
  }
});



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
