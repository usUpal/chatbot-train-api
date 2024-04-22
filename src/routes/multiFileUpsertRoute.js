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
import FormData from "form-data"; 

const formData = new FormData();
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
const upload = multer({ storage: storage, fileFilter: fileFilter});

// Endpoint to create chatbot, upload files, and upsert them
router.post(
  "/create-chatbot-weavi-2/:userId",
  upload.array("files"),
  async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }

    const userId = req.params.userId;
    console.log(`userid: ${userId}`);
    console.log(chalk.bgMagenta("POST /api/v1/create-chatbot-weavi"));

    const id = uuidv4();
    const lastThreeDigit = id.slice(-3);
    const name = lastThreeDigit + "_eventos";
    const createdDate = new Date();
    const formatedDate = moment(createdDate).format(
      "YYYY-MM-DD HH:mm:ss.SSSSSS"
    );

    try {
      // Get chatbot template data
      const response = await axios.get(
        "https://chatbot-train.keoscx.com/api/v1/template-chatbots-wevi"
      );
      const results = response.data;
      
      // Update chat flow data with unique index
      const parsedJSON = JSON.parse(results[0].flowData);
      const indexTag = generateRandomName();
      parsedJSON.nodes.forEach((node) => {
        if (node.id === "weaviate_0") {
          node.data.inputs.weaviateIndex = indexTag;
          console.log("Updated weaviateIndex:", node.data.inputs.weaviateIndex);
        }
      });
      const modifiedFlowdata = JSON.stringify(parsedJSON, null, 2);
      const modifiedCategory = "weaviate";

      // Prepare chatbot data
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

      // Insert chat flow into database
      const sql = "INSERT INTO chat_flow SET ?";
      connection.query(sql, newChatFlow, async (err, result) => {
        if (err) {
          console.error("Error inserting chat flow into database:", err);
          res.status(500).send("Error creating chatbot");
          return;
        }
        console.log("Chatbot created successfully ✅");

        // Get all files in the uploads directory
        const uploadFolderPath = "/home/luisflr/chatbot-train-api/src/routes/uploads/";
        const files = await getAllFilesInDirectory(uploadFolderPath);

        // Upsert each file into the chatbot
        const upsertStatus = await Promise.all(files.map(async (filename) => {
          const filePath = path.join(uploadFolderPath, filename);

          // Create FormData with the file
          const formData = new FormData();
          formData.append("files", fs.createReadStream(filePath));
          formData.append("openAIApiKey", process.env.OPENAI_API_KEY);
          formData.append("stripNewLines", "true");
          formData.append("batchSize", 1);

          // Upsert the file into the chatbot
          console.log("Upserting file:", filename);
          return await upsertFile(formData, id);
        }));

        console.log("All files upserted successfully");

        // Delete all files in the uploads folder
        await deleteAllFiles(uploadFolderPath);

        console.log("All files deleted from the uploads folder");

        res.status(201).send({
          chatbotId: id,
          chatbotName: name,
          upsertStatus: upsertStatus,
        });
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error retrieving chat flow data");
    }
  }
);

// Function to upsert a file into the chatbot
async function upsertFile(formData, chatbotId) {
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
    return response.data;
  } catch (error) {
    console.error("Error upserting file:", error);
    return null;
  }
}

// Function to get all files in a directory
function getAllFilesInDirectory(directory) {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

// Function to delete all files in a directory
function deleteAllFiles(directory) {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        reject(err);
      } else {
        files.forEach((file) => {
          const filePath = path.join(directory, file);
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error("Error deleting file:", err);
            }
          });
        });
        resolve();
      }
    });
  });
}

export default router;
