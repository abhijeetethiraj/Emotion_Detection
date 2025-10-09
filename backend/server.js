const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB= require('./config/mongodb')
const mongoose = require('mongoose');
const routes = require('./routes/userRoute')
const emotion = require('./routes/emotionAnalysis')


dotenv.config()
const app = express()
app.use(cors())
app.use(express.json());
connectDB()

const Port = process.env.PORT || 3000; 
app.get('/',(req,res)=>{
    res.send("'Hello from your local server!'")
})
app.use('/api/user', routes)
app.use('/api/emotions', emotion);


app.listen(Port,()=>{
    console.log(`Server is running at http://localhost:${Port}`);
})