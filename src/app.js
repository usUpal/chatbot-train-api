import express from "express";
import "dotenv/config";
import connection from "./configs/dbConnect.js";
import testRoute from "./routes/testRoute.js";
import healthRoute from "./routes/healthRoute.js";
import templateChatbotRoute from "./routes/templateChatbotRoute.js";
import createChatbotRoute from "./routes/createChatbotRoute.js";
import weviCreateChatbotRoute from "./routes/weviCreateChatbotRoute.js";

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
app.use("/api/v1", createChatbotRoute);
app.use("/api/v1", weviCreateChatbotRoute);

app.listen(port, () => {
  console.log(`Server:${port}✅`);
});
