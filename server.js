import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors'; // to connect to the frontend

import userRoute from './routes/userRoute.js';
import courseRoute from './routes/courseRoute.js';
import taskRoute from './routes/taskRoute.js';
import settingRoute from './routes/settingRoute.js';

dotenv.config();

const app = express();

// middlewares
app.use(express.json());
app.use(cors({
  origin: "https://pchronos.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));


mongoose.connect(process.env.MONGO_URL)
    .then((result) => {
        console.log('MongoDB connected successfully');
    })
    .catch((err) => {
        console.log(`Failed to connect to mongoDB: ${err.message}`);
    });

    // load cron
    import("./jobs/cronJobs.js");


// routes 
app.use('/api/user', userRoute)
app.use('/api/courses', courseRoute);
app.use('/api/tasks', taskRoute);
app.use('/api/settings', settingRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});