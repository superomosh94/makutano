const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
const PORT = 3003;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");

// Database connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

connection.connect(err => {
  if (err) throw err;
  console.log("✅ Connected to MySQL Database");
});

// ---------------- Routes ---------------- //

// Homepage
app.get("/", (req, res) => {
  res.render("index.ejs");
});

// Show form to add new user
app.get("/newuser", (req, res) => {
  res.render("newuser.ejs");
});

// Handle new user form submission
app.post("/newuser", async (req, res) => {
  const { fullname, email, password } = req.body;

  if (!fullname || !email || !password) {
    return res.status(400).send("All fields are required");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)";
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

// Show all users
app.get("/users", (req, res) => {
  connection.query("SELECT userid, fullname, email FROM users", (err, users) => {
    if (err) {
      return res.status(500).send("❌ Error retrieving users: " + err);
    }
    // only pass users here (no posts)
    res.render("users.ejs", { users });
  });
});

// Add new post
app.get("/newpost", (req, res) => {
  res.render("newpost.ejs"); // a simple form for posts
});

app.post("/newposts", (req, res) => {
  const { content } = req.body;
  const postowner = 1; // hardcoded for now; later use logged-in user
  if (!content) return res.status(400).send("Content is required");

  const query = "INSERT INTO posts (content, postowner) VALUES (?, ?)";
  connection.query(query, [content, postowner], (err) => {
    if (err) {
      return res.status(500).send("❌ Error adding post: " + err);
    }
    res.redirect("/posts");
  });
});

// Show all posts
app.get("/posts", (req, res) => {
  const query = `
    SELECT posts.postid, posts.content, posts.createdat, users.fullname
    FROM posts
    JOIN users ON posts.postowner = users.userid
    ORDER BY posts.createdat DESC
  `;

  connection.query(query, (err, posts) => {
    if (err) {
      return res.status(500).send("❌ Error retrieving posts: " + err);
    }
    res.render("posts.ejs", { posts });
  });
});

// Dashboard (both users + posts)
app.get("/dashboard", (req, res) => {
  connection.query("SELECT userid, fullname, email FROM users", (err, users) => {
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
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 App running on http://127.0.0.1:${PORT}`);
});
