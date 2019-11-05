const express = require('express');
const app = express();
const connectDB = require('./config/db');
//import routes
const userRoutes = require('./routes/api/users');
const authRoutes = require('./routes/api/auth');
const profileRoutes = require('./routes/api/profile');
const postsRoutes = require('./routes/api/posts');
// connect db
connectDB()

const PORT =  process.env.PORT || 5000;
app.get('/', (req,res)=> res.send('re'));
//define routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/posts', postsRoutes)
//init server
app.listen(PORT, ()=> {
  console.log(`Server started ${PORT}`);
});