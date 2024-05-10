import express from "express";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import axios from "axios";
import connection from "../configs/dbConnect.js";
import chalk from "ansi-colors";
import { generateRandomName } from "../utils/helpers.js";
import fs from "fs";
import multer from "multer";
import path from "path";

const router = express.Router();

// Backend validation middleware to allow only .txt files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "text/plain") {
    cb(null, true);
  } else {
    cb(new Error("Only text files are allowed."), false);
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/home/luisflr/chatbot-train-api/src/routes/uploads/"); // Destination folder for saving files
  },
  filename: function (req, file, cb) {
    const filename = `${file.originalname}`;
    cb(null, filename); // Unique filename
  },
});
const upload = multer({ storage: storage, fileFilter: fileFilter });

router.post(
  "/create-chatbot-weavi/:userId",
  upload.array("files"),
  async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }
    // console.log(
    //   `file sumbitted:::: /home/luisflr/chatbot-train-api/src/routes/uploads/${req.files[0].filename}`
    // );
    const userId = req.params.userId;
    console.log(chalk.blue(`POST /api/v1/create-chatbot-weavi ${chalk.gray(new Date().toISOString())}`));

    const id = uuidv4();
    const lastFiveDigit = id.slice(-5);
    // const name = lastFoveDigit + "_eventos-bot";
    const name = `eventos_bot_${lastFiveDigit}`;
    const createdDate = new Date();
    const formatedDate = moment(createdDate).format(
      "YYYY-MM-DD HH:mm:ss.SSSSSS"
    );
    // const systemPrompt = "you are a chatbot name luminous bot";
    // console.log(req.body.bot_text);

    try {
      const response = await axios.get(
        "https://chatbot-train.keoscx.com/api/v1/template-chatbots-wevi"
      );
      const results = response.data;
      const sql = "INSERT INTO chat_flow SET ?";
      //TODO dynaimically check results[i] for weaviate category
      // MODIFY THE FLOWDATA
      const flowdataString = results[0].flowData;
      // Parse the JSON string
      const parsedJSON = JSON.parse(flowdataString);
      const weaviateIndex = name.charAt(0).toUpperCase() + name.slice(1);
      const indexTag = weaviateIndex;
      // Modify the value of systemMessage
      parsedJSON.nodes.forEach((node) => {
        if (node.id === "weaviate_0") {
          // Set the desired weaviateIndex value
          node.data.inputs.weaviateIndex = indexTag;
        }
      });

      // Convert back to JSON string with proper formatting
      const modifiedFlowdata = JSON.stringify(parsedJSON, null, 2);
      const modifiedCategory = "eventos-bot-txtFile-wevi";

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
      const filePath = `/home/luisflr/chatbot-train-api/src/routes/uploads/${req.files[0].filename}`;
      // UPSERT
      const formData = {
        files: fs.createReadStream(filePath),
        openAIApiKey: process.env.OPENAI_API_KEY,
        stripNewLines: "true",
        batchSize: 1,
      };

      // UPSERT FUNCTION
      async function query(formData, chatbotId) {
        const config = {
          method: "POST",
          url: `${process.env.CHATBOT_BASE_URL}/api/v1/vector/upsert/${chatbotId}`,
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        };


        try {
          const response = await axios(config);
          // console.log({ status: response.status, data: response.data });
          return {
            status: response.status,
            weaviateIndex: indexTag,
            data: response.data,
          };
        } catch (error) {
          console.error(error);
        }
      }

      connection.query(sql, newChatFlow, async (err, result) => {
        if (err) throw err;

        // console.log(logData);
        const upsert = await query(formData, id);

        res.status(201).send({
          chatbotId: id,
          chatbotName: name,
          upsertStatus: upsert.status,
        });
        // delete file
        let deleteStatus = false;
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
            return;
          }
          deleteStatus = true;
        });
        

        const logData = {
          message: `chatbot created successfully ✅`,
          route: "/api/v1/create-chatbot-weavi",
          createdDate: formatedDate,
          chatbotId: id,
          chatbotName: name,
          userId: userId,
          upsertStatus: upsert.status,
          weaviateIndex: upsert.weaviateIndex,
          fileDeleted: deleteStatus,
          chatbotLink: `${process.env.CHATBOT_BASE_URL}/canvas/${id}`,
        };
        console.log(logData);
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("❌ Error retrieving chat flow data");
    }
  }
);

export default router;
