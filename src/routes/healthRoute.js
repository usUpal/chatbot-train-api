
import express from "express";
const router = express.Router();

router.get("/health", (req, res) => {
    res.status(200).json({status:"server is healthy, wealthy & wise"});
  });

export default router;
