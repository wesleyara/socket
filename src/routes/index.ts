import express from "express";
import path from "path";

const basepath = path.join(__dirname, "../../public/index.html");
const router = express.Router();

router.get("/", (req, res) => {
  res.sendFile(basepath);
});

export default router;