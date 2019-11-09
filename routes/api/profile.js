const express = require('express');
const router = express.Router();
const Profile = require('../../models/Profile');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const {check, validationResult} = require('express-validator');
 
router.get('/', async(req,res) => {
  try {
    let allProfiles = await Profile.find().populate('user', ['name','avatar']);
    res.json(allProfiles);
  } catch (err) {
    res.status(500).send('server error');
  }
});
router.get('/me', auth , async(req,res)=> {
  try{
    console.log('user',req.user)
    let profile = await Profile.findOne({user: req.user.id}).populate('user',['name','avatar']);
    if(!profile) {
      return res.status(400).json({msg:'no profile for this user'})
    }
    res.json(profile);
  } catch(err) {
    console.log(err.message);
    res.status(500).send('server error')
  }
});

router.post('/',[auth,[
  check('status', 'status is required').not().isEmpty(),
  check('skills', 'skills is required').not().isEmpty()
]], async(req,res)=>{
  let errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({errors: errors.array() })
  }
  const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    twitter,
    instagram,
    linkedin
  } = req.body;
  //Build profile object
  const profileFields = {}
  profileFields.user = req.user.id
  if (company)        profileFields.company   = company;
  if (website)        profileFields.website   = website;
  if (location)       profileFields.location  = location;
  if (bio)            profileFields.bio       = bio;
  if (status)         profileFields.status    = status;
  if (githubusername) profileFields.githubusername = githubusername;
  if (skills)         profileFields.skills = skills.split(',').map((item)=> {return item.trim()})
  profileFields.social = {}
  if (youtube) profile.social.youtube = youtube;
  if (youtube) profile.social.facebook = facebook;
  if (youtube) profile.social.twitter = twitter;
  if (youtube) profile.social.instagram = instagram;
  if (youtube) profile.social.linkedin = linkedin;
  
  try {
    let profile = await Profile.findOne({user: req.user.id});
    if(profile) {
      //update
      profie = await Profile.findOneAndUpdate(
        { user: req.user.id }, 
        { $set:profileFields },
        { new:true }
      );
      return res.json(profile);
    }
    //create
    profile = new Profile(profileFields);
    await profile.save();
    res.json(profile);
  } catch(err) {
    console.log(err.message);
    res.status(500).send('server error');
  }
});

module.exports = router