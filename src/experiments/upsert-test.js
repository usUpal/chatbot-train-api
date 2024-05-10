import fs from "fs";
import axios from "axios";
import connection from "../configs/dbConnect.js";

const filePath = `/home/luisflr/chatbot-train-api/src/example.txt`;
// UPSERT
const formData = {
  files: fs.createReadStream(filePath),
  openAIApiKey: process.env.OPENAI_API_KEY,
  stripNewLines: "true",
  batchSize: 1,
};
// console.log(formData);

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
  console.log(`upserting chatbot url: ${config.url}`);

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


const response = await axios.get(
    "https://chatbot-train.keoscx.com/api/v1/template-chatbots-wevi"
  );
  const results = response.data;
  const id = "04c6e957-db14-42c2-9ef6-ff920f2e375b";
  const sql = "INSERT INTO chat_flow SET ?";
  //TODO dynaimically check results[i] for weaviate category
  // MODIFY THE FLOWDATA
  const flowdataString = results[0].flowData;
  // Parse the JSON string
  const parsedJSON = JSON.parse(flowdataString);
  const indexTag = "IndexTag-1234";
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
  // delete file
  // fs.unlink(filePath, (err) => {
  //   if (err) {
  //     console.error("Error deleting file:", err);
  //     return;
  //   }
  //   console.log("File deleted successfully");
  // });
});
