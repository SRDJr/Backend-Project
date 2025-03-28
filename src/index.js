import { dbConnect } from "../config/dbConnect.js";
import 'dotenv/config';
import { app } from "./app.js";

const PORT = process.env.PORT || 5000;

dbConnect()

app.listen(PORT, () => {

    console.log(`App is running at ${PORT}`);

})
