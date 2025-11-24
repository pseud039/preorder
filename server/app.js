import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import Clientrouter from "./routes/client.route.js"
import MenuRouter from "./routes/menu.route.js"
import AdminRouter from "./routes/admin.route.js"

const app = express();

app.use(
  cors({
    origin:['http://localhost:3000','http://localhost:3001'],
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/client",Clientrouter);
app.use("/home",MenuRouter);
app.use("/admin",AdminRouter);

export { app };
