import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";
import express from "express";
import {getMenu,getItemDetails,getMostPopular} from "../controllers/client/client.menu.controller.js";

const router = express.Router();

router.get("/menu",getMenu);
router.get("/menu/popular",getMostPopular);
router.get("/menu/:id",getItemDetails);
// router.post("/menu",addMenuItems);
// router.put("/menu/:id",updateItem);
// router.delete("/menu/:id",deleteItem);

export default router;