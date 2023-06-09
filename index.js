const express = require("express");
const multer = require("multer");
const app = express();
const cors = require("cors");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.use(cors());

app.use(express.static("uploads"));

// Configuration de la base de données
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "backend-angular-dfs-23",
});

// Middleware pour vérifier le token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, "your_secret_key", (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = user;
    next();
  });
}

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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const article = JSON.parse(req.body.article);
    const extension = file.originalname.split(".").pop();
    const nomImage = "image_article_" + article.title + "." + extension;
    req.nomImage = nomImage;
    cb(null, nomImage);
  },
});

const upload = multer({ storage: storage }).array("fichier");

// Route pour créer un nouvel article
app.post("/article", upload, (req, res) => {
  const article = JSON.parse(req.body.article);

  if (req.nomImage) {
    article.nom_image = req.nomImage;
  }

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
app.put("/article/:id", upload, (req, res) => {
  const articleId = req.params.id;
  const article = JSON.parse(req.body.article);

  if (req.nomImage) {
    article.nom_image = req.nomImage;
  }

  connection.query(
    "UPDATE article SET ? WHERE id = ?",
    [article, articleId],
    (err) => {
      if (err) {
        console.error("Erreur lors de la mise à jour de l'article :", err);
        res.status(500).send("Erreur serveur");
        return;
      }
      //NOK -> res.sendStatus(200);
      res.status(200).json(article);
    }
  );
});

// Route pour supprimer un article
app.delete("/article/:id", authenticateToken, (req, res) => {
  const articleId = req.params.id;

  if (req.user.admin != 1) {
    res.sendStatus(403);
    return;
  }

  connection.query("DELETE FROM article WHERE id = ?", [articleId], (err) => {
    if (err) {
      console.error("Erreur lors de la suppression de l'article :", err);
      res.status(500).send("Erreur serveur");
      return;
    }
    res.sendStatus(204);
    return;
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Vérifier si l'utilisateur existe dans la base de données
  connection.query(
    "SELECT * FROM user WHERE email = ?",
    [email],
    (err, results) => {
      if (err) {
        throw err;
      }

      if (results.length === 0) {
        return res.status(401).json({ message: "Adresse e-mail incorrecte" });
      }

      const user = results[0];

      // Vérifier le mot de passe
      bcrypt.compare(password, user.password, (bcryptErr, bcryptResult) => {
        if (bcryptErr || !bcryptResult) {
          return res.status(401).json({ message: "Mot de passe incorrect" });
        }

        // Générer un token JWT
        const token = jwt.sign(
          { email: user.email, admin: user.admin },
          "your_secret_key",
          { expiresIn: "1d" } // Expiration du token
        );

        // Retourner le token JWT
        res.json({ token });
      });
    }
  );
});

// Point de terminaison pour l'inscription
app.post("/signup", (req, res) => {
  const { email, password, admin } = req.body;

  // Vérifier si l'utilisateur existe déjà dans la base de données
  connection.query(
    "SELECT * FROM user WHERE email = ?",
    [email],
    (err, results) => {
      if (err) {
        throw err;
      }

      if (results.length > 0) {
        return res.status(409).json({ message: "Cet utilisateur existe déjà" });
      }

      // Hasher le mot de passe avant de l'enregistrer dans la base de données
      bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
        if (hashErr) {
          throw hashErr;
        }

        // Insérer le nouvel utilisateur dans la base de données
        connection.query(
          "INSERT INTO user (email, password, admin) VALUES (?, ?, ?)",
          [email, hashedPassword, admin],
          (insertErr, insertResult) => {
            if (insertErr) {
              throw insertErr;
            }

            // Générer un token JWT pour l'utilisateur nouvellement inscrit
            const token = jwt.sign(
              { email, admin },
              "your_secret_key",
              { expiresIn: "1h" } // Expiration du token
            );

            // Retourner le token JWT
            res.json({ token });
          }
        );
      });
    }
  );
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
