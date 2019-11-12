const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User.js');
const bcrypt = require('bcryptjs');
const config = require('config');
const {check, validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');

router.get('/', auth, async (req,res)=> {
   try{
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
   } catch(err) { 
      console.error('ss',err.message);
   }
});

router.post('/', [
   check('email', 'Include a valid email').isEmail(),
   check('password', 'Password is required').exists()
 ], async (req,res)=> {
   const errors = validationResult(req);
   //if required fields are true
   if(!errors.isEmpty()) {
     return res.status(400).json({errors: errors.array()});
   };
   const {email,password} = req.body;
   try {
       //if user exists
       let user = await User.findOne({email});
       if (!user) {
         return res.status(400).json([{msg: 'Invalid credentials'}]);
       }
      
       const isMatch = await bcrypt.compare(password, user.password);

       if (!isMatch) {
         return res.status(400).json([{msg: 'Invalid password'}]);
       }
       //return jsonwebtoken
       const payload = {
          user: {
            id: user.id
          }
       }
       console.log( payload)
       jwt.sign(
         payload, 
         config.get('jwtSecret'),
         {expiresIn: 360000},
         (err, token)=> {
            console.log('token',token)
           if(err) {
             throw err;
           };
           res.json({token});
         }
       );
       
   } catch(err) {
     console.log(err.message);
     res.status(500).send('Server error');
   } 
});
module.exports = router