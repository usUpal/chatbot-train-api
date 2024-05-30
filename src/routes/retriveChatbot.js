import connection from "../configs/dbConnect.js";
import express from "express";
import chalk from 'ansi-colors'
const router = express.Router();

router.get("/retrieve-chatbot/:bot_id", (req, res) => {
  console.log(
    chalk.blue(`GET /api/v1/retrieve-chatbot ${chalk.gray(new Date().toISOString())}`)
  );
  const {bot_id}=req.params;

  const sql =
    `SELECT * FROM chat_flow WHERE id LIKE '${bot_id}';`;
  connection.query(sql, (err, results) => {
    if (err) throw err; 
    res.send(results);
  });
});

export default router;

















// import connection from "../configs/dbConnect.js";
// import express from "express";
// import chalk from 'ansi-colors';

// const router = express.Router();

// // Route to retrieve chatbot information
// router.get("/retrieve-chatbot/:id", async (req, res) => {
//   const { id } = req.params;

//   // Log the request with a timestamp
//   console.log(
//     chalk.blue(`GET /api/v1/retrieve-chatbot/${id} ${chalk.gray(new Date().toISOString())}`)
//   );
//   console.log(id)

//   try {
//     // Prepare the SQL query with a parameter placeholder
//     // const sql = `SELECT * FROM chat_flow WHERE id LIKE '04c6e957-db14-42c2-9ef6-ff920f2e375b'`;

//     // Execute the query asynchronously with the bound parameter
//     // const results = await connection.query(sql, [id]);
//     const results = await connection.query(sql);
//     // console.log(results)

//     // Send the results as the response
//     console.log(results._results)
//     // res.send(results._results);
//     //
//     const sql =
//     "SELECT * FROM chat_flow WHERE name LIKE 'template-txt-chatbot';";
//   // const sql = "SELECT name, id FROM chat_flow";
//   connection.query(sql, (err, results) => {
//     if (err) throw err; 
//     res.send(results);
//   });
//   } catch (err) {
//     // Log the error and send a 500 status response
//     console.error(chalk.red('Error executing query:', err.message));
//     res.status(500).send('Server Error');
//   }
// });

// export default router;