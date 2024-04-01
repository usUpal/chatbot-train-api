import express from "express";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import axios from "axios";
import connection from "../configs/dbConnect.js";
import chalk from "ansi-colors";
import { generateRandomName } from "../utils/helpers.js";
import fs from "fs";
import multer from "multer";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/home/luisflr/chatbot-train-api/src/routes/uploads/"); // Destination folder for saving files
  },
  filename: function (req, file, cb) {
    const filename = `${file.originalname}`;
    cb(null, filename); // Unique filename
  },
});
const upload = multer({ storage: storage });

router.post(
  "/create-chatbot-weavi",
  upload.array("files"),
  async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }
    console.log(
      `file sumbitted:::: /home/luisflr/chatbot-train-api/src/routes/uploads/${req.files[0].filename}`
    );
    console.log(chalk.bgMagenta("POST /api/v1/create-chatbot-weavi"));
    const id = uuidv4();
    const lastTwoDigits = id.slice(-3);
    const name = lastTwoDigits + "_eventos";
    const createdDate = new Date();
    const formatedDate = moment(createdDate).format(
      "YYYY-MM-DD HH:mm:ss.SSSSSS"
    );
    // const systemPrompt = "you are a chatbot name luminous bot";
    // console.log(req.body.bot_text);

    try {
      const response = await axios.get(
        "https://chatbot-train.keoscx.com/api/v1/template-chatbots"
      );
      const results = response.data;
      const sql = "INSERT INTO chat_flow SET ?";
      //TODO dynaimically check results[i] for weaviate category
      // MODIFY THE FLOWDATA
      const flowdataString = results[1].flowData;
      // Parse the JSON string
      const parsedJSON = JSON.parse(flowdataString);
      const indexTag = generateRandomName();
      // Modify the value of systemMessage
      parsedJSON.nodes.forEach((node) => {
        if (node.id === "weaviate_0") {
          // Set the desired weaviateIndex value
          node.data.inputs.weaviateIndex = indexTag;
          console.log("Updated weaviateIndex:", node.data.inputs.weaviateIndex);
        }
      });

      // Convert back to JSON string with proper formatting
      const modifiedFlowdata = JSON.stringify(parsedJSON, null, 2);
      const modifiedCategory = "weaviate";

      const newChatFlow = {
        id: id,
        name: name,
        flowData: modifiedFlowdata,
        deployed: results[1].deployed,
        isPublic: results[1].isPublic,
        apikeyid: results[1].apikeyid,
        chatbotConfig: results[1].chatbotConfig,
        createdDate: formatedDate,
        updatedDate: formatedDate,
        apiConfig: results[1].apiConfig,
        analytic: results[1].analytic,
        category: modifiedCategory,
        speechToText: results[1].speechToText,
      };
      const filePath = `/home/luisflr/chatbot-train-api/src/routes/uploads/${req.files[0].filename}`;
      // UPSERT
      const formData = {
        files: fs.createReadStream(
          filePath
        ),
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

          // console.log(response.data,typeof response.status);
          console.log({ status: response.status, data: response.data });
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
        console.log("chatbot created successfully ✅"); //! remove later
        const upsert = await query(formData, id);
        //   console.log(upsert);

        res.status(201).send({
          chatbotId: id,
          chatbotName: name,
          upsertStatus: upsert,
        });
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('Error deleting file:', err);
            return;
          }
          console.log('File deleted successfully');
        });
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error retrieving chat flow data");
    }
  }
);

export default router;
