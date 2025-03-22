import { dbConnect } from "../config/dbConnect.js";
import express from "express";
import 'dotenv/config';

const app = express();

dbConnect();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(`App is running at ${PORT}`)

})