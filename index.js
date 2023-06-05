const express = require("express");
const multer = require("multer");
const app = express();
const cors = require("cors");
const mysql = require("mysql");

app.use(cors());

// Configuration de la base de données
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "backend-angular-dfs-23",
});

// Connexion à la base de données
connection.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données :", err);
    return;
  }
  console.log("Connecté à la base de données MySQL");
});

// Configuration du middleware pour le parsing du corps de la requête
app.use(express.json());

// Route pour récupérer tous les articles
app.get("/liste-articles", (req, res) => {
  connection.query("SELECT * FROM article", (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des articles :", err);
      res.status(500).send("Erreur serveur");
      return;
    }
    res.json(results);
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
