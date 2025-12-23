import express from "express";
import router from "./src/routes/index.js";
import { PORT } from "./src/configs/env.js"
import sequelize from './src/configs/sequelize.js';
import { initAssociations } from "./src/models/association.model.js";
import cors from 'cors';
import { errorMiddleware } from "./src/middlewares/error.middleware.js";

const app = express();
app.use(express.json({ limit: "10mb" }));               
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['http://localhost:5173', 'https://se104.software', 'https://www.se104.software'],      
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use('/api', router);

// Unified JSON error responses
app.use(errorMiddleware);

app.get('/', (req, res) => {
  res.send('Welcome to the API');
});

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    initAssociations();
  } catch (err) {
    console.error('Database connection failed:', err);
  }
});