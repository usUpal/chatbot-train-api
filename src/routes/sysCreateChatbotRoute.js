import express from "express";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import axios from "axios";
import connection from "../configs/dbConnect.js";
import chalk from "ansi-colors";

const router = express.Router();

router.post("/create-chatbot-sys/:userId", async (req, res) => {
  console.log(
    chalk.blue(
      `POST /api/v1/create-chatbot-sys ${chalk.gray(new Date().toISOString())}`
    )
  );
  const userId = req.params.userId ? req.params.userId : 89;
  console.log(typeof userId)

  const id = uuidv4();
  const last5Digits = id.slice(-5);
  const name = `eventos_bot_${last5Digits}`;
  const createdDate = new Date();
  const formatedDate = moment(createdDate).format("YYYY-MM-DD HH:mm:ss.SSSSSS");
  console.log(typeof formatedDate)

  const systemPrompt =
    req.body.bot_text || "you are a chatbot name keosbot bot";
  try {
    const response = await axios.get(
      "https://chatbot-train.keoscx.com/api/v1/template-chatbots-sys"
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
        node.data.inputs.systemMessage = `You are a chatbot. answer ques based on these infos:${systemPrompt}`;
      }
    });

    // Convert back to JSON string with proper formatting
    const modifiedFlowdata = JSON.stringify(parsedJSON, null, 2);
    const modifiedCategory = "eventos-bot-sys";

    // new chatflow object
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
      category: modifiedCategory,
      speechToText: results[0].speechToText,
      userId: userId,
    };
    // create new chatbot in the database(mysql)
    connection.query(sql, newChatFlow, (err, result) => {
      if (err) throw err;
      res.status(200).send({ chatbotId: id, chatbotName: name });
    });

    // logdata
    const logData = {
      message: `chatbot created successfully ✅`,
      route: "POST /api/v1/create-chatbot-sys",
      createdDate: formatedDate,
      chatbotId: id,
      chatbotName: name,
      userId: userId,
      chatbotLink: `${process.env.CHATBOT_BASE_URL}/canvas/${id}`,
      status: 200,
    };
    console.log(logData);
  } catch (error) {
    console.error(error);
    res.status(500).send(" ❌ Error retrieving chat flow data");
  }
});

export default router;
