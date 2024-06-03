import express from "express";
import "dotenv/config";
// import path from "path";

import healthRoute from "./routes/healthRoute.js";
import connection from "./configs/dbConnect.js";
import testRoute from "./routes/testRoute.js";
// import templateChatbotWeviRoute from "./routes/templateChatbotRoute.js";
import weviCreateChatbotRoute from "./routes/weviCreateChatbotRoute.js";
import sysCreateChatbotRoute from "./routes/sysCreateChatbotRoute.js";
import userChatbotListRoute from "./routes/userChatbotListRoute.js";
import deleteChatbotRoute from "./routes/deleteChatbotRoute.js";
import mergedTrainRoute from "./routes/mergedTrainRoute.js";
import templateChatbotWeviRoute from "./routes/templateChatbotWeviRoute.js";
import templateChatbotSysRoute from "./routes/templateChatbotSysRoute.js";
import multiFileUpsertRoute from "./routes/multiFileUpsertRoute.js";
import chatbotRetrainSys from "./routes/chatbotRetrainSys.js";
import chatbotRetrainTxt from "./routes/chatbotRetrainTxt.js";
// import chatbotRetrainSys from "./routes/chatbotRetrainSys.js"
import retriveChatbot from "./routes/retriveChatbot.js";


const app = express();
const port = process.env.PORT || 8081;
app.use(express.json());

// DATABASE CONNECTION
connection.connect((err) => {
  if (err) {
    console.error(err);
  } else {
    console.log("MySQL: ✅");
  }
})

app.use("/api/v1", testRoute);
app.use("/api/v1", healthRoute);
app.use("/api/v1", templateChatbotWeviRoute);
app.use("/api/v1", templateChatbotSysRoute);
app.use("/api/v1", sysCreateChatbotRoute);
// app.use("/api/v1", weviCreateChatbotRoute); // deprecated
app.use("/api/v1", userChatbotListRoute);
app.use("/api/v1", deleteChatbotRoute);
app.use("/api/v1", mergedTrainRoute);
app.use("/api/v1", multiFileUpsertRoute);
app.use("/api/v1", chatbotRetrainSys);
app.use("/api/v1", chatbotRetrainTxt);
app.use("/api/v1", retriveChatbot);



app.listen(port, () => {
  console.log(`Server:${port}✅`);
});
