import express from "express";
import {getMenu,getItemDetails,getMostPopular} from "../controllers/client/client.menu.controller.js";
import { isCustomer,verifyJWT } from "../middlewares/middleware.js";

const router = express.Router();

router.get("/menu",verifyJWT, isCustomer, getMenu);
router.get("/menu/popular",getMostPopular);
router.get("/menu/:id",getItemDetails);

export default router;
