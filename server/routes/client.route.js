import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";
import express from "express";
import { forgotPassword, LoginClient, logoutClient, resetpass, SignUpClient } from "../controllers/client/client.auth.controller.js";

const router = express.Router();

router.post("/signUp",SignUpClient);
router.post("/login",LoginClient);
router.post("/password",forgotPassword);
router.post("/password/:token",resetpass);
router.get("/logout", logoutClient);

export default router;
