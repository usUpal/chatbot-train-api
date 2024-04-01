import express from "express";
import bodyParser from "body-parser";
const app = express();
app.use(express.json());
// const router = express.Router();

app.post("/test", (req, res) => {
    console.log("POST /api/v1/test");
    console.log(req.body.bot_text)
    res.status(200).json({ message: "Hello from test route" });
});

// app.use('/', router);
export default app;
