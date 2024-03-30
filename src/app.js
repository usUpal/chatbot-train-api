import express from "express";
import "dotenv/config";
import connection from "./models/db.js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import moment from "moment";
import fs from "fs";

const app = express();
app.use(express.json());
const port = process.env.PORT || 8081;

// DATABASE CONNECTION
connection.connect((err) => {
  if (err) {
    console.error(err);
  } else {
    console.log("MySQL: ✅");
  }
});
function generateRandomName() {
  const randomNumber = Math.floor(Math.random() * 9000) + 1000; // Generates a random number between 1000 and 9999
  const randomName = `Index${randomNumber}`;
  return randomName;
}

// HEALTH
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({status:"server is healthy, wealthy & wise"});
});
// TEST ENDPOINT
app.post("/api/v1/test-endpoint", (req, res) => {
  console.log("POST /api/v1/test-endpoint");
  console.log(req.body);
  res.send({ reqBody: `${req.body.bot_text}`, testResult: "success" });
});
// TEMPLATE CHATBOT
app.get("/api/v1/template-chatbots", (req, res) => {
  console.log("GET /api/v1/template-chatbots");
  const sql =
    "SELECT * FROM chat_flow WHERE name LIKE 'weaviate-test' OR name LIKE 'Merck Januvia QA' OR name LIKE 'keos-test';";
  // const sql = "SELECT name, id FROM chat_flow";
  connection.query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
});

// CHATBOT CREATE WITH SYSTEM PROMPT
app.post("/api/v1/create-chatbot", async (req, res) => {
  console.log("POST /api/v1/create-chatbot");
  const id = uuidv4();
  const lastTwoDigits = id.slice(-2);
  const name = lastTwoDigits + "_eventos";
  const createdDate = new Date();
  const formatedDate = moment(createdDate).format("YYYY-MM-DD HH:mm:ss.SSSSSS");
  // const systemPrompt = "you are a chatbot name luminous bot";
  console.log(req.body.bot_text);
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
        console.log(node.data.inputs.systemMessage); //! remove later
      }
    });

    // Convert back to JSON string with proper formatting
    const modifiedFlowdata = JSON.stringify(parsedJSON, null, 2);

    // console.log(results[0].flowData);
    // const flowData = JSON.parse(results[0].flowData);
    // console.log(flowData);
    // const openAIFunctionAgentNode = flowData.nodes.find(
    //   (node) => node.id === "openAIFunctionAgent_0"
    // );
    // openAIFunctionAgentNode.data.inputs.systemMessage = `${systemPrompt}`;

    //   const modifiedFlowData = {
    //     ...results[0].flowData,
    //     nodes: results[0].flowData.nodes.map((node) => {
    //       if (node.id === 'openAIFunctionAgent_0') {
    //         return {
    //           ...node,
    //           data: {
    //             ...node.data,
    //             inputs: {
    //               ...node.data.inputs,
    //               systemMessage: `${systemPrompt}`,
    //             },
    //           },
    //         };
    //       }
    //       return node;
    //     }),
    //   };
    //   console.log(modifiedFlowData)
    // console.log(results[0].flowData);
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
      console.log("Chatbot created successfully"); //! remove later
      res.send({ chatbotId: id, chatbotName: name });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving chat flow data");
  }
});

// CHATBOT CREATE ATTACHMENT WITH WEAVIATE
app.post("/api/v1/create-chatbot-wevi", async (req, res) => {
  console.log("POST /api/v1/create-chatbot");
  const id = uuidv4();
  const lastTwoDigits = id.slice(-3);
  const name = lastTwoDigits + "_eventos";
  const createdDate = new Date();
  const formatedDate = moment(createdDate).format("YYYY-MM-DD HH:mm:ss.SSSSSS");
  // const systemPrompt = "you are a chatbot name luminous bot";
  console.log(req.body.bot_text);

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

    // const flowData = JSON.parse(results[0].flowData);
    // console.log(flowData);
    // const openAIFunctionAgentNode = flowData.nodes.find(
    //   (node) => node.id === "openAIFunctionAgent_0"
    // );
    // openAIFunctionAgentNode.data.inputs.systemMessage = `${systemPrompt}`;

    //   const modifiedFlowData = {
    //     ...results[0].flowData,
    //     nodes: results[0].flowData.nodes.map((node) => {
    //       if (node.id === 'openAIFunctionAgent_0') {
    //         return {
    //           ...node,
    //           data: {
    //             ...node.data,
    //             inputs: {
    //               ...node.data.inputs,
    //               systemMessage: `${systemPrompt}`,
    //             },
    //           },
    //         };
    //       }
    //       return node;
    //     }),
    //   };
    //   console.log(modifiedFlowData)
    // console.log(results[0].flowData);
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

    // UPSERT
    const formData = {
      files: fs.createReadStream(
        "/home/luisflr/chatbot-train-api/src/example.txt"
      ),

      openAIApiKey: process.env.OPENAI_API_KEY,

      stripNewLines: "true", // Convert to string

      batchSize: 1,
    };
    // UPSERT FUNCTION
    async function query(formData, chatbotId) {
      const config = {
        method: "POST",

        url: `${process.env.CHATBOT_BASE_URL}/api/v1/vector/upsert/${chatbotId}`, //weaviate-test2

        data: formData,

        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      try {
        const response = await axios(config);

        // console.log(response.data,typeof response.status);
        console.log({ status: response.status, data: response.data });
        return { status: response.status, data: response.data};
      } catch (error) {
        console.error(error);
      }
    }
    connection.query(sql, newChatFlow, async (err, result) => {
      if (err) throw err;
      console.log("Chatbot created successfully"); //! remove later
      const upsert = await query(formData, id);
      console.log(upsert);

      res.status(201).send(
        {
          chatbotId: id,
          chatbotName: name,
          weaviateIndex: indexTag,
          upsertStatus: upsert,
        }
      );
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving chat flow data");
  }
});

app.listen(port, () => {
  console.log(`Server:${port}✅`);
});
