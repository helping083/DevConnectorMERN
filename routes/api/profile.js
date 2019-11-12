const express = require('express');
const router = express.Router();
const Profile = require('../../models/Profile');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const request = require('request');
const config = require('config');
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


//@route   GET api/profile/user/:user_id
//@desc    Get profile by id
//@accesss public
router.get('/user/:user_id', async (req,res) => {
  try {
    const profile = await Profile.findOne({user: req.params.user_id}).populate('user', ['name','avatar']);
    if(!profile) {
      return res.status(400).json({msg:'no profile for this user'}); 
    }
    res.json(profile) 
  } catch(err) {
    if(err.kind =='ObjectId' ) {
      return res.status(400).json({msg:'no profile for this user'});
    }
    res.status(500).send('server error');
  }
});

//@route   DELETE api/profile
//@desc    delete profile user and post
//@accesss private 
router.delete('/', auth, async (req, res) => {
  try {
    await Profile.findOneAndRemove({user: req.user.id});
    await User.findOneAndRemove({_id: req.user.id});
    res.json({msg:'user removed'});
  } catch(err) {
    console.log(err.message);
    res.status(500).send('server error')
  }
});

//@route   PUT api/profile/experience
//@desc    add profile experience
//@accesss private 
router.put('/experience',[auth,[
  check('title', 'Title is required').not().isEmpty(),
  check('company', 'Company is required').not().isEmpty(),
  check('from','from is required').not().isEmpty()
]], async (req,res) => {
  let errors = validationResult(req);
  if(!errors.isEmpty()) {
    res.status(400).json({errors:errors});
  }
  const {title, company,location,from,to,current,description} = req.body;
  const newExp = {
    title, company,location,from,to,current,description
  }
  try {
    let profile = await Profile.findOne({user: req.user.id});
    profile.experience.unshift(newExp);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.log(err.message);
     res.status(500).send(err)
  }
});


//@route   PUT api/profile/education
//@desc    add profile education
//@accesss private 
router.put('/education',[auth,[
  check('school', 'School is required').not().isEmpty(),
  check('degree', 'Degree is required').not().isEmpty(),
  check('fieldofstudy', 'fieldofstudy is required').not().isEmpty(),
  check('from','from is required').not().isEmpty()
]], async (req,res) => {
  let errors = validationResult(req);
  if(!errors.isEmpty()) {
    res.status(400).json({errors:errors});
  }
  const {school, degree,fieldofstudy,from,to,current,description} = req.body;
  const newEducation = {
    school, degree,fieldofstudy,from,to,current,description
  }
  try {
    let profile = await Profile.findOne({user: req.user.id});
    profile.education.unshift(newEducation);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.log(err.message);
     res.status(500).send(err)
  }
});

//@route   DELETE api/profile/education/:edu_id
//@desc    delete profile education
//@accesss private 
router.delete('/education/:edu_id', auth, async (req,res)=> {
  try {
    const profile = await Profile.findOne({user:req.user.id});
    // get remove index
    const removeIndex = profile.education.map((item)=>{
      return item.id;
    }).indexOf(req.params.edu_id);
    //remove from array
    profile.education.splice(removeIndex, 1);
    //save modified
    await profile.save()
    res.json(profile);
    
  } catch (error) {
    console.log(err.message);
    res.status(500).send('server error')
  }
});

//@route   DELETE api/profile/experience/:id
//@desc    add profile experience
//@accesss private 
router.delete('/experience/:exp_id', auth, async (req,res)=> {
  try {
    const profile = await Profile.findOne({user:req.user.id});
    // get remove index
    const removeIndex = profile.experience.map((item)=>{
      return item.id;
    }).indexOf(req.params.exp_id);
    //remove from array
    profile.experience.splice(removeIndex, 1);
    //save modified
    await profile.save()
    res.json(profile);
    
  } catch (error) {
    console.log(err.message);
    res.status(500).send('server error')
  }
});
//@route   GET api/profile/github/:user_name
//@desc    Get user repos from github
//@accesss public
router.get('/github/:username', (req,res)=>{
  try {
    const options = {
      uri:`https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubclientid')}&client_secret=${config.get('githubsecret')}`,
      method:'GET',
      headers: {'user-agent':'node.js'}
    }
    request(options, (error,response,body)=>{
      if(error) {
        console.log(error);
      };
      if(response.statusCode !=200) return res.status(404).json({msg:'not found'});
      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.log(error);
    res.status(500).send('Server error');
  }
});
module.exports = router