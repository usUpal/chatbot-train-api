import express from "express";
import chalk from "ansi-colors";
const router = express.Router();

router.get("/health", (req, res) => {
  console.log(
    chalk.blue(`GET /api/v1/health ${chalk.gray(new Date().toISOString())}`)
  );
  res.status(200).json({ status: "server is healthy, wealthy & wise" });
});

export default router;
