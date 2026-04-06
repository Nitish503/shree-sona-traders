const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// Routes for specific pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/construction", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "construction.html"));
});

app.get("/rental", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "rental.html"));
});

app.get("/fuel", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "fuel.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

// Example API route for items
app.get("/items", (req, res) => {
  res.json([{ name: "Cement", description: "High quality cement", category: "construction" }]);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));