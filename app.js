// ----------------- Imports -----------------
const express = require("express");
const sesion = require("express-session");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
require("dotenv").config();

// ----------------- App Setup -----------------
const app = express();
const PORT = process.env.PORT || 3003;

// ----------------- Middleware -----------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.use(sesion ({
  secret:django,
  resave:false,
  saveUninitialized:true,)

// ----------------- Database Connection -----------------
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
  console.log("✅ Connected to MySQL Database");
});

// ----------------- Routes -----------------

// Homepage
app.get("/", (req, res) => {
  res.render("index.ejs");
});

// Users - Add new user form
app.get("/newuser", (req, res) => {
  res.render("newuser.ejs");
});

// Users - Handle new user submission
app.post("/newuser", async (req, res) => {
  const { fullname, email, password } = req.body;
  if (!fullname || !email || !password) {
    return res.status(400).send("All fields are required");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query =
      "INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)";
    connection.query(query, [fullname, email, hashedPassword], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("❌ Error adding user");
      }
      res.redirect("/users");
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error hashing password");
  }
});

// Users - List all users
app.get("/users", (req, res) => {
  connection.query(
    "SELECT userid, fullname, email FROM users",
    (err, users) => {
      if (err) {
        return res.status(500).send("❌ Error retrieving users: " + err);
      }
      res.render("users.ejs", { users });
    }
  );
});

// Posts - Add new post form
app.get("/newpost", (req, res) => {
  res.render("newpost.ejs");
});

// Posts - Handle new post submission
app.post("/newposts", (req, res) => {
  const { content } = req.body;
  const postowner = 1; // TODO: Replace with logged-in user id

  if (!content) return res.status(400).send("Content is required");

  const query = "INSERT INTO posts (content, postowner) VALUES (?, ?)";
  connection.query(query, [content, postowner], (err) => {
    if (err) return res.status(500).send("❌ Error adding post: " + err);
    res.redirect("/posts");
  });
});

// Posts - Show all posts
app.get("/posts", (req, res) => {
  const query = `
    SELECT posts.postid, posts.content, posts.createdat, users.fullname
    FROM posts
    JOIN users ON posts.postowner = users.userid
    ORDER BY posts.createdat DESC
  `;

  connection.query(query, (err, posts) => {
    if (err) return res.status(500).send("❌ Error retrieving posts: " + err);
    res.render("posts.ejs", { posts });
  });
});

// Clients - Registration form
app.get("/register", (req, res) => {
  res.render("register-clients.ejs");
});

// Clients - Handle registration
app.post("/register", async (req, res) => {
  const {
    firstname,
    lastname,
    email,
    phone,
    password,
    confirmPassword,
    yob,
    gender,
    country,
    city,
  } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO clients (firstname, lastname, email, phone, password, yob, gender, country, city)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(
      sql,
      [
        firstname,
        lastname,
        email,
        phone,
        hashedPassword,
        yob,
        gender,
        country,
        city,
      ],
      (err) => {
        if (err)
          return res.status(500).send("❌ Error registering client: " + err);
        // Redirect with success flag
        res.redirect("/clients?success=1");
      }
    );
  } catch (err) {
    res.status(500).send("❌ Error processing registration");
  }
});

// Clients - Show all clients
app.get("/clients", (req, res) => {
  connection.query(
    "SELECT id, firstname, lastname, email, phone, yob, gender, country, city FROM clients",
    (err, clients) => {
      if (err)
        return res.status(500).send("❌ Error retrieving clients: " + err);
      res.render("client-table.ejs", { clients });
    }
  );
});
//get login
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

// POST /login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }

  const query = "SELECT fullname, email, password FROM users WHERE email = ?";
  connection.query(query, [email], async (err, results) => {
    if (err) {
      return res.status(500).send("Error retrieving user: " + err);
    }

    if (results.length === 0) {
      return res.status(400).send("Invalid email or password");
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).send("Invalid email or password");
    }

    // Successful login
    // res.redirect("/dashboard");
    res.send(`Welcome, ${user.fullname}! You have successfully logged in.`);
  });
});

// Dashboard - Show users + posts
app.get("/dashboard", (req, res) => {
  connection.query(
    "SELECT userid, fullname, email FROM users",
    (err, users) => {
      if (err) return res.status(500).send("❌ Error retrieving users");

      const postsQuery = `
      SELECT posts.postid, posts.content, posts.createdat, users.fullname
      FROM posts
      JOIN users ON posts.postowner = users.userid
      ORDER BY posts.createdat DESC
    `;

      connection.query(postsQuery, (err, posts) => {
        if (err) return res.status(500).send("❌ Error retrieving posts");
        res.render("dashboard.ejs", { users, posts });
      });
    }
  );
});

// 404 - Page not found
app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

// ----------------- Start Server -----------------
app.listen(PORT, () => {
  console.log(`🚀 App running at http://127.0.0.1:${PORT}`);
});
