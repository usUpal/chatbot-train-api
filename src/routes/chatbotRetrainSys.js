import express from "express";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import axios from "axios";
import connection from "../configs/dbConnect.js";
import chalk from "ansi-colors";

const router = express.Router();

router.put("/retrain-sys", async (req, res) => {
  console.log(
    chalk.blue(
      `PUT /api/v1/create-chatbot-sys ${chalk.gray(new Date().toISOString())}`
    )
  );
 const {bot_id, status, bot_text, userId}= req.body;

  const createdDate = new Date();
  const formatedDate = moment(createdDate).format("YYYY-MM-DD HH:mm:ss.SSSSSS");

  const systemPrompt =
    bot_text || "you are a chatbot name keosbot bot";
  console.log(`sys msg: ${systemPrompt}`)
  try {
    const response = await axios.get(
      `https://chatbot-train.keoscx.com/api/v1/retrieve-chatbot/${bot_id}`
    );
    const results = response.data;
    const sql = `UPDATE chat_flow SET ? WHERE id LIKE '${bot_id}';`;


    const flowdataString = results[0].flowData;


    const parsedJSON = JSON.parse(flowdataString);


    if(status===true){
        
        parsedJSON.nodes.forEach((node) => {
            if (node.id === "openAIFunctionAgent_0") {
              node.data.inputs.systemMessage = `${node.data.inputs.systemMessage}. ${bot_text}`;
            }
          });

    }else{
     
        parsedJSON.nodes.forEach((node) => {
            if (node.id === "openAIFunctionAgent_0") {
              node.data.inputs.systemMessage = `${bot_text}`;
            }
          });
    }

    const modifiedFlowdata = JSON.stringify(parsedJSON, null, 2);


    const modifiedCategory = "eventos-bot-sys";

    const sql2 = `UPDATE chat_flow SET flowData = '${modifiedFlowdata}' WHERE id LIKE '${bot_id}';`;
    console.log(`#{sql2}`)



    // new chatflow object
    const newChatFlow = {
      id: results[0].id,
      name: results[0].name,
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
      userId: results[0].userId,
    };
    console.log(typeof results[0].createdDate)
    
    connection.query(sql, newChatFlow, (err, result) => {
      if (err) throw err;
      res.status(200).send({ chatbotId: results[0].id, chatbotName: results[0].name });
    });

    // logdata
    const logData = {
      message: `chatbot retrained successfully ✅`,
      route: "POST /api/v1/retrain-sys",
      createdDate: formatedDate,
      chatbotId: results[0].id,
      chatbotName: results[0].name,
      userId: userId,
      chatbotLink: `${process.env.CHATBOT_BASE_URL}/canvas/${results[0].id}`,
      status: 200,
    };
    console.log(logData);
  } catch (error) {
    console.error(error);
    res.status(500).send(" ❌ Error retrieving chat flow data");
  }
});

export default router;