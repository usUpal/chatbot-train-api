import express from "express";
import axios from "axios";
import chalk from "ansi-colors";
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
const upload = multer({ storage: storage, fileFilter: fileFilter });

// Endpoint to create chatbot, upload files, and upsert them
router.put("/retrain-txt/:userId", upload.array("files"), async (req, res) => {
  console.log(
    chalk.blue(
      `GET /api/v1/retrain-txt/ ${chalk.gray(new Date().toISOString())}`
    )
  );
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded.");
  }
  const { bot_id } = req.query;
  const userId = req.params.userId;

  try {
    const uploadFolderPath =
      "/home/luisflr/chatbot-train-api/src/routes/uploads/";
    const files = await getAllFilesInDirectory(uploadFolderPath);
    const fileNames = [];

    // Upsert each file into the chatbot
    const upsertStatus = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(uploadFolderPath, filename);

        // Create FormData with the file
        const formData = new FormData();
        formData.append("files", fs.createReadStream(filePath));
        formData.append("openAIApiKey", process.env.OPENAI_API_KEY);
        formData.append("stripNewLines", "true");
        formData.append("batchSize", 1);

        // Upsert the file into the chatbot
        fileNames.push(filename);
        return await upsertFile(formData, bot_id);
      })
    );
    await deleteAllFiles(uploadFolderPath);

    res.status(201).send({
      chatbotId: bot_id,
      userId: userId,
      retrainStatus: 200,
    });
    const log_data = {
      route: "/retrain-txt",
      userId: userId,
      chatbotId: bot_id,
      fileNames: fileNames,
      upsertStatus: upsertStatus[0],
      chatbot_link: `${process.env.CHATBOT_BASE_URL}/canvas/${bot_id}`,
    };
    console.log(log_data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving chat flow data");
  }
});

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
