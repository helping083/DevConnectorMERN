const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
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
      res.send('User created')
  } catch(err) {
    console.err(err.message);
    res.status(500).send('Server error');
  } 
 });

module.exports = router 