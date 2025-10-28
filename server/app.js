import express from "express";
import cors from "cors";
import { SignUpClient } from "./controllers/client.controller.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.static("public"));
// app.use(cookieParser());

app.post("/signUp", SignUpClient);

export { app };
