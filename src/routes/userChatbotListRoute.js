import connection from "../configs/dbConnect.js";
import express from "express";
import chalk from 'ansi-colors'
const router = express.Router();

router.get("/user-chatbots/:userId", (req, res) => {
  console.log(chalk.bgMagenta("GET /api/v1/user-chatbots"));
  const userId = req.params.userId;
  // "SELECT * FROM chat_flow WHERE name LIKE 'weaviate-final-demo' OR name LIKE 'Merck Januvia QA' OR name LIKE 'keos-test';";
  const sql =
    `SELECT * FROM chat_flow WHERE userId=${userId} ORDER BY createdDate DESC;`;
  // const sql = "SELECT name, id FROM chat_flow";
  connection.query(sql, (err, results) => {
    if (err) throw err; 
    res.send(results);
  });
});

export default router;
