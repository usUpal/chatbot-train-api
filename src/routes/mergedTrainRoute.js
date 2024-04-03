import express from "express";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import axios from "axios";
import connection from "../configs/dbConnect.js";
import chalk from "ansi-colors";
import { generateRandomName } from "../utils/helpers.js";
import fs from "fs";
import multer from "multer";
import path, {dirname} from "path";

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
    "/create-chatbot-weavi-merged/:userId",
    upload.array("files"),
    async (req, res) => {
        if (!req.files || req.files.length === 0) {
            return res.status(400).send("No files uploaded.");
        }
        console.log(
            `file submitted:::: /home/luisflr/chatbot-train-api/src/routes/uploads/${req.files[0].filename}`
        );
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
            const response = await axios.get(
                "https://chatbot-train.keoscx.com/api/v1/template-chatbots"
            );
            const results = response.data;
            const sql = "INSERT INTO chat_flow SET ?";
            const flowdataString = results[0].flowData;
            const parsedJSON = JSON.parse(flowdataString);
            const indexTag = generateRandomName();
            parsedJSON.nodes.forEach((node) => {
                if (node.id === "weaviate_0") {
                    node.data.inputs.weaviateIndex = indexTag;
                    console.log("Updated weaviateIndex:", node.data.inputs.weaviateIndex);
                }
            });
            const modifiedFlowdata = JSON.stringify(parsedJSON, null, 2);
            const modifiedCategory = "weaviate";

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

            const mergedFilePath = path.join(
                __dirname,
                "uploads",
                "merge.txt"
            );
            const mergedFileStream = fs.createWriteStream(mergedFilePath, {
                flags: "a",
            });

            req.files.forEach((file, index) => {
                const filePath = path.join(
                    __dirname,
                    "uploads",
                    file.filename
                );
                const fileContent = fs.readFileSync(filePath);
                mergedFileStream.write(fileContent);

                if (index !== req.files.length - 1) {
                    mergedFileStream.write("\n\n");
                }

                fs.unlinkSync(filePath); // Delete the file after merging
            });

            mergedFileStream.end();

            const filePath = mergedFilePath;
            const formData = {
                files: fs.createReadStream(filePath),
                openAIApiKey: process.env.OPENAI_API_KEY,
                stripNewLines: "true",
                batchSize: 1,
            };

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
                console.log("chatbot created successfully ✅");
                const upsert = await query(formData, id);

                res.status(201).send({
                    chatbotId: id,
                    chatbotName: name,
                    upsertStatus: upsert,
                });

                fs.unlinkSync(filePath); // Delete the merged file after upsert
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error retrieving chat flow data");
        }
    }
);

export default router;
