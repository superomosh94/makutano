const express = require("express");
const app = express();
const mysql = require("mysql");
require("dotenv").config(); // load environment variables from .env

// create database connection using environment variables
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// routes
app.get("/", (req, res) => {
  res.render("index.ejs");
});

// add new post to posts in the database
app.post("/newposts", (req, res) => {
  const { content } = req.body;
  const postowner = 1; // hardcoded for now; later use logged-in user ID
  const query = "INSERT INTO posts (content, postowner) VALUES (?, ?)";

  connection.query(query, [content, postowner], (err, result) => {
    if (err) {
      return res.status(500).send("Error adding post: " + err);
    }
    res.redirect("/posts");
  });
});

// show posts page
app.get("/posts", (req, res) => {
  const query = `
    SELECT posts.postid, posts.content, posts.createdat, users.fullname
    FROM posts
    JOIN users ON posts.postowner = users.userid
    ORDER BY posts.createdat DESC
  `;

  connection.query(query, (err, posts) => {
    if (err) {
      return res.status(500).send("Error retrieving posts: " + err);
    }
    res.render("posts.ejs", { posts: posts });
  });
});

// show users page
app.get("/users", (req, res) => {
  connection.query("SELECT * FROM users", (err, users) => {
    if (err) {
      return res.status(500).send("Error retrieving users: " + err);
    }
    res.render("users.ejs", { users: users });
  });
});

// optional dashboard with both users and posts
app.get("/dashboard", (req, res) => {
  connection.query("SELECT * FROM users", (err, users) => {
    if (err) {
      return res.status(500).send("Error retrieving users: " + err);
    }
    connection.query("SELECT * FROM posts", (err, posts) => {
      if (err) {
        return res.status(500).send("Error retrieving posts: " + err);
      }
      res.render("dashboard.ejs", { users: users, posts: posts });
    });
  });
});

// 404
app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

// start the app
app.listen(3003, () =>
  console.log("App running on http://127.0.0.1:3003")
);
// create a new user for a form submission ---cfreate a newuserr.js file ,newuser get route and newuser post route
