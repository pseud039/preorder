import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Import routes
import clientRoutes from "./routes/client.route.js";
import notificationRoutes from "./routes/notification.route.js";
// import Clientrouter from "./routes/client.route.js"
import MenuRouter from "./routes/menu.route.js"
import AdminRouter from "./routes/admin.route.js"
// ... other routes

import { startAllCrons } from "./utils/cron/index.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN.split(",").map(origin => origin.trim()),
    credentials: true
  }
});

global.io = io;

const getAllowedOrigins = () => {
  const origins = process.env.CORS_ORIGIN || "http://localhost:3000";
  return origins.split(",").map(origin => origin.trim());
};

// const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin: getAllowedOrigins(),
  // origin: function (origin, callback) {
  //   console.log(origin);
  //   console.log(allowedOrigins);

  //   // Allow requests with no origin (like mobile apps or curl requests)
  //   if (!origin) return callback(null, true);
    
  //   if (allowedOrigins.indexOf(origin) !== -1) {
  //     callback(null, true);
  //   } else {
  //     callback(new Error("Not allowed by CORS"));
  //   }
  // },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
// Middleware
// app.use(cors({
//   origin: process.env.FRONTENED_URL,
//   credentials: true
// }));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/client", clientRoutes);
app.use("/notifications", notificationRoutes);
app.use("/home",MenuRouter);
app.use("/admin",AdminRouter);

// ... other routes

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user's personal room
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start CRON jobs
startAllCrons();

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Socket.IO ready`);
  console.log(` Push notifications configured`);
});
export { app };

