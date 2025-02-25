const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000; // Render assegnerà automaticamente una porta

// Servire i file statici dalla cartella "public" (dove metti HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// Rotta principale
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API di test
app.get("/api/test", (req, res) => {
  res.json({ message: "Il server funziona!" });
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
