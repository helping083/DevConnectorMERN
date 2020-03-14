const express = require('express');
const router = express.Router();
const Post = require('../../models/Post');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const {check, validationResult} = require('express-validator');

//@route  Post/api
//@desc   Create a post
//@access Private
router.post('/', [auth,[
  check('text', 'text is required').not().isEmpty()
]], async(req,res) =>{
  let errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({errors: errors})
  }
  try {
    const user = await User.findById(req.user.id).select('-password');
    console.log('user',user)
    const newPost = new Post({
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    });
    const post = await newPost.save();
    res.status(201).json(post);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('server error');
  }
});
//@route  get/api
//@desc   get posts
//@access Private
router.get('/', auth, async (req,res)=> {
  try {
    let posts = await Post.find().sort({date: -1});
    res.json(posts);
  } catch (error) {
    console.log(error.message)
    res.status(500).send('server error')
  }
})
//@route  GET /api/posts/:id
//@desc   get posts by id
//@access Private
router.get('/:id', auth, async (req,res)=> {
  try {
    const post = await Post.findById(req.params.id);
    if(!post) {
      return res.status(404).json({msg:"post no found"});
    }
    res.json(post); 
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({msg:"post no found"});
    }
    console.log(error.message)
    res.status(500).send('server error');
  }
});

//@route  DELETE /api/posts/:id
//@desc   get and delete post by id
//@access Private
router.delete('/:id', auth, async (req,res)=>{
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({msg:'post not found'});
    }
    if (post.user.toString()!==req.user.id) {
      return res.status(401).json({msg:'user not authorized'});
    }
    await post.remove();
    res.status(204).json({msg:"post removed"});
  } catch (error) {
    console.log(error.message)
    res.status(500).send('server error');
  }
});
//@route  PUT /api/posts/like/:id
//@desc   Like a post
//@access Private
router.put('/like/:id', auth, async (req,res)=>{
  try {
    const post = await Post.findById(req.params.id);
    //check if been liked
    if( post.likes.filter(like=>like.user.toString() === req.user.id).length>0 ) {
      return res.status(400).json({msg:'post liked'});
    }
    console.log(post);
    post.likes.unshift({user:req.user.id});
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.log(error.message)
    res.status(500).send('server error');
  }
});

router.put('/unlike/:id', auth, async (req,res)=>{
  try {
    const post = await Post.findById(req.params.id);
    //check if been liked
    if( post.likes.filter(like=>like.user.toString() === req.user.id).length === 0 ) {
      return res.status(400).json({msg:'post has not been liked'});
    }
    // get remove index 
    let removeIndex = post.likes.map( like =>{ like.user.toString()}).indexOf(req.user.id);
    post.likes.splice(removeIndex,1);
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.log(error.message)
    res.status(500).send('server error');
  }
});
//@route  PUT /api/comment
//@desc   add a comment
//@access Private
router.post('/comment/:id',[auth, [check('text', 'text is required').not().isEmpty()]], async (req,res)=>{
 try {
   let user = await User.findById(req.user.id).select('-password');
   let post = await Post.findById(req.params.id);
   let newComment = {
    text:req.body.text,
    name: user.name,
    avatar: user.avatar,
    user: req.user.id
   };
   post.comments.unshift(newComment);
   await post.save()
   res.json(post.comments);
 } catch (error) {
  console.log(error.message)
  res.status(500).send('server error');
 }
});
//@route  DELETE /api/comment/delete/:id
//@desc   delete a comment
//@access Private
router.delete('/comment/:id/:comment_id', auth, async (req,res)=>{
  try {
    let post = await Post.findById(req.params.id);
    let comment = post.comments.find(comment => comment.id === req.params.comment_id);
    if(!comment) {
      return res.status(404).json({msg:'does not exist'});
    }
    if( comment.user.toString()!==req.user.id ) {
      return res.status(401).json({msg: 'user not authorized'});
    }
    let commentIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
    post.comments.splice(commentIndex, 1);
    await post.save();
    res.json(post.comments); 
  } catch (error) {
    console.log(error.message);
    res.status(500).send('server error');
  }
});
module.exports = router