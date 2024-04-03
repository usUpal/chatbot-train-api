import express from "express";
import connection from "../configs/dbConnect.js";
import chalk from "ansi-colors";

const router = express.Router();

router.delete("/delete-chatbot/", async (req, res) => {
  console.log(chalk.bgRed("DELETE /api/v1/delete-chatbot"));

  const { userId, chatbotId } = req.query;
  console.log(`userId: ${userId}`);
    console.log(`chatbotId: ${chatbotId}`);
  try {
    const sql = "DELETE FROM chat_flow WHERE id = ? AND userId = ?";
    connection.query(sql, [chatbotId, userId], (err, result) => {
        
      if (err) {
        console.error(err);
        return res.status(500).send("Error deleting chatbot");
      }
      if (result.affectedRows === 0) {
        return res.status(404).send("Chatbot not found");
      }
      console.log("Chatbot deleted successfully ✅");
      res
        .status(200)
        .send({ status: 200, message: "Chatbot deleted successfully" });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting chatbot");
  }
});

export default router;
