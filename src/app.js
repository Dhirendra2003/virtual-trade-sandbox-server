import express from "express";
import authRoute from "./routes/auth.route";

const app = express();

app.use(express.json());

//Routes

app.use("/api/auth", authRoute);

app.get("/", (req, res) => {
    res.json("Hello, World!");
});

export default app;
