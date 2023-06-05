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

// Route pour récupérer un article par son ID
app.get("/article/:id", (req, res) => {
  const articleId = req.params.id;
  connection.query(
    "SELECT * FROM article WHERE id = ?",
    [articleId],
    (err, results) => {
      if (err) {
        console.error("Erreur lors de la récupération de l'article :", err);
        res.status(500).send("Erreur serveur");
        return;
      }
      if (results.length === 0) {
        res.status(404).send("Article non trouvé");
        return;
      }
      res.json(results[0]);
    }
  );
});

// Route pour créer un nouvel article
app.post("/article", (req, res) => {
  const article = req.body;
  connection.query("INSERT INTO article SET ?", article, (err, result) => {
    if (err) {
      console.error("Erreur lors de la création de l'article :", err);
      res.status(500).send("Erreur serveur");
      return;
    }
    article.id = result.insertId;
    res.status(201).json(article);
  });
});

// Route pour mettre à jour un article
app.put("/article/:id", (req, res) => {
  const articleId = req.params.id;
  const article = req.body;
  connection.query(
    "UPDATE article SET ? WHERE id = ?",
    [article, articleId],
    (err) => {
      if (err) {
        console.error("Erreur lors de la mise à jour de l'article :", err);
        res.status(500).send("Erreur serveur");
        return;
      }
      res.sendStatus(200);
    }
  );
});

// Route pour supprimer un article
app.delete("/article/:id", (req, res) => {
  const articleId = req.params.id;
  connection.query("DELETE FROM article WHERE id = ?", [articleId], (err) => {
    if (err) {
      console.error("Erreur lors de la suppression de l'article :", err);
      res.status(500).send("Erreur serveur");
      return;
    }
    res.sendStatus(204);
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
