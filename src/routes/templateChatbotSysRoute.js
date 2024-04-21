import connection from "../configs/dbConnect.js";
import express from "express";
import chalk from 'ansi-colors'
const router = express.Router();

router.get("/template-chatbots-sys", (req, res) => {
  console.log(chalk.bgMagenta("GET /api/v1/template-chatbots"));
  // "SELECT * FROM chat_flow WHERE name LIKE 'weaviate-final-demo' OR name LIKE 'Merck Januvia QA' OR name LIKE 'keos-test';";
  const sql =
    "SELECT * FROM chat_flow WHERE name LIKE 'template-simple-chatbot';";
  // const sql = "SELECT name, id FROM chat_flow";
  connection.query(sql, (err, results) => {
    if (err) throw err; 
    res.send(results);
  });
});

export default router;
