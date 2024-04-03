import express from "express";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import axios from "axios";
import connection from "../configs/dbConnect.js";
import chalk from "ansi-colors";

const router = express.Router();

router.post("/create-chatbot-sys", async (req, res) => {
  console.log(chalk.bgMagenta("POST /api/v1/create-chatbot"));
  const id = uuidv4();
  const lastTwoDigits = id.slice(-3);
  const name = lastTwoDigits + "_eventos";
  const createdDate = new Date();
  const formatedDate = moment(createdDate).format("YYYY-MM-DD HH:mm:ss.SSSSSS");
  // console.log(`request body:${req.body.bot_text}`);
  const systemPrompt2 = `you are a chatbot name keosbot & you will answer questions based on:  ${req.body.bot_text}; don't ans any other ques outside of this topic;"`;
  const systemPrompt =
    req.body.bot_text || "you are a chatbot name keosbot bot"; //!
  try {
    const response = await axios.get(
      "https://chatbot-train.keoscx.com/api/v1/template-chatbots"
    );
    const results = response.data;
    const sql = "INSERT INTO chat_flow SET ?";
    // MODIFY THE FLOWDATA
    const flowdataString = results[0].flowData;
    // Parse the JSON string
    const parsedJSON = JSON.parse(flowdataString);

    // Modify the value of systemMessage
    parsedJSON.nodes.forEach((node) => {
      if (node.id === "openAIFunctionAgent_0") {
        node.data.inputs.systemMessage = `${systemPrompt}`;
        console.log(`system prompt: ${node.data.inputs.systemMessage}`); //! remove later
      }
    });

    // Convert back to JSON string with proper formatting
    const modifiedFlowdata = JSON.stringify(parsedJSON, null, 2);

    const newChatFlow = {
      id: id,
      name: name,
      flowData: modifiedFlowdata,
      deployed: results[0].deployed,
      isPublic: results[0].isPublic,
      apikeyid: results[0].apikeyid,
      chatbotConfig: results[0].chatbotConfig,
      createdDate: formatedDate,
      updatedDate: formatedDate,
      apiConfig: results[0].apiConfig,
      analytic: results[0].analytic,
      category: results[0].category,
      speechToText: results[0].speechToText,
    };

    connection.query(sql, newChatFlow, (err, result) => {
      if (err) throw err;
      console.log("Chatbot created successfully ✅"); //! remove later
      res.status(200).send({chatbotId: id, chatbotName: name });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving chat flow data");
  }
});

export default router;
