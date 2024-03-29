import express from "express";
import "dotenv/config";
import connection from "./models/db.js";
import chalk from "ansi-colors";
const app = express();
const port = process.env.PORT || 8081;

// DATABASE CONNECTION
connection.connect((err) => {
  if (err) {
    console.error(err);
  } else {
    console.log("MySQL: ✅");
  }
});
// INTRO
app.get("/", (req, res) => {
  res.send({ project: "chatbot-train-api" });
});

// TEMPLATE CHATBOT
app.get("/api/v1/template-chatbots", (req, res) => {
  console.log("GET /api/v1/template-chatbots");
//   const sql =
//     "SELECT * FROM chat_flow WHERE name LIKE 'Merk QA Bot' OR name LIKE 'Merck Januvia QA' OR name LIKE 'keos-test';";
  const sql =
    "SELECT name, id FROM chat_flow";
  connection.query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
});

// CHATBOT CREATE
app.post("/api/v1/create-chatbot", (req, res) => {
  res.send({ message: "chatbot created" });
});

app.listen(port, () => {
  console.log(`Server:${port}✅`);
});
