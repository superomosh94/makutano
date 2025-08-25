const express = require("express");
const app = express();
const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Roguomondo1",
  database: "socialapp2",
  port: 3306,
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
  const query = "INSERT INTO posts (content, postowner) VALUES (?, ?)";
  connection.query(query, [content, 1], (err, result) => {
    if (err) {
      return res.status(500).send("Error adding post: " + err);
    }
    res.redirect("/posts"); // redirect once post is added
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

// optional dashboard with both
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
app.listen(3003, () => console.log("App running on http://127.0.0.1:3003"));
