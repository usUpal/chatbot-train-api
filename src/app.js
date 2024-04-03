import express from "express";
import "dotenv/config";
// import path from "path";

import connection from "./configs/dbConnect.js";
import testRoute from "./routes/testRoute.js";
import healthRoute from "./routes/healthRoute.js";
import templateChatbotRoute from "./routes/templateChatbotRoute.js";
import weviCreateChatbotRoute from "./routes/weviCreateChatbotRoute.js";
import sysCreateChatbotRoute from "./routes/sysCreateChatbotRoute.js";
import userChatbotListRoute from "./routes/userChatbotListRoute.js";
import deleteChatbotRoute from "./routes/deleteChatbotRoute.js";
import mergedTrainRoute from "./routes/mergedTrainRoute.js";

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
app.use("/api/v1", templateChatbotRoute);
app.use("/api/v1", sysCreateChatbotRoute);
app.use("/api/v1", weviCreateChatbotRoute);
app.use("/api/v1", userChatbotListRoute);
app.use("/api/v1", deleteChatbotRoute);
app.use("/api/v1", mergedTrainRoute);


app.listen(port, () => {
  console.log(`Server:${port}✅`);
});
