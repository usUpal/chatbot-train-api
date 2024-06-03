import express from "express";
import chalk from "ansi-colors";
import multer from "multer";

const app = express();

// Configure multer
const storage = multer.memoryStorage(); // Store file in memory (alternatively, you can store it on disk)
const upload = multer({ storage });

app.post("/test", upload.single('file'), (req, res) => {
    console.log(
        chalk.blue(
          `PUT /test ${chalk.gray(new Date().toISOString())}`
        )
    );

    // Log the text fields
    console.log(req.body);

    // Log the file information
    if (req.file) {
        console.log(`Received file: ${req.file.originalname}`);
    } else {
        console.log('No file received');
    }

    res.status(200).json({ message: req.body });
});

export default app;
