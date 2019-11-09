const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator');
const User = require('../../models/User');

router.post('/', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Include a valid email').isEmail(),
  check('password', 'Enter a passwrod').isLength({ min:6 })
], async (req,res)=> {
  const errors = validationResult(req);
  //if required fields are true
  if(!errors.isEmpty()) {
    return res.status(400).json({errors: errors.array()});
  };
  const {name,email,password} = req.body;
  try {
      //if user exists
      let user = await User.findOne({email});
      if (user) {
        return res.status(400).json([{msg: 'User already exists'}]);
      }
      //get users gravatars
      const avatar = gravatar.url(email, {
        s:'200px',
        r: 'pg',
        d: 'mm'
      });
      //create user
      user = new User({
        name,
        email,
        avatar,
        password
      });
      //encrypt passwords
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      //save user
      await user.save();

      //return jsonwebtoken
      const payload = {
        user: {
          id: user.id
        }
     }
      jwt.sign(
        payload, 
        config.get('jwtSecret'),
        {expiresIn: 360000},
        (err, token)=> {
          if(err) {
            throw err;
          };
          res.json({token});
        }
      );
      
  } catch(err) {
    console.err(err.message);
    res.status(500).send('Server error');
  } 
 });

router.get('/', async (req,res) => {
 try {
    let allUsers = await User.find().select("-password").select('-__v');
    res.json(allUsers);
 } catch(err) {
    res.status(500).send('server error');
 }
});
module.exports = router 