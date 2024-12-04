//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs =require("ejs");
const mongoose = require('mongoose');

const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate')
const app = express();

// console.log(process.env.API_KEY);


app.use(express.static("public"));
app.set('view engine','ejs');
app.use (bodyParser.urlencoded({extended:true}));

app.use(session({
  secret:"Our little secret.",
  resave:false,
  saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));
// passport.use(new FacebookStrategy({
//   clientID: process.env.FACEBOOK_APP_ID,
//   clientSecret: process.env.FACEBOOK_APP_SECRET,
//   callbackURL: "http://localhost:3000/auth/facebook/secrets"
// },
// function(accessToken, refreshToken, profile, cb) {
//   console.log(profile);
//   User.findOrCreate({ facebookId: profile.id }, function (err, user) {
//     return cb(err, user);
//   });
// }
// ));

main().catch(err => console.log(err));

async function main() {
  try {
    await mongoose.connect(process.env.URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}
const userSchema =new mongoose.Schema({
  email: String,
  password: String,
  googleId:String,
  facebookId:String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// const secret ="Thisisourlittlesecret.";

// userSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields: ["password"]});

const User =new mongoose.model("User",userSchema);


passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

app.get("/",function(req,res){
    res.render("home");

});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));


  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

//   app.get('/auth/facebook',
//   passport.authenticate('facebook', { scope: ['user_friends', 'manage_pages'] }));

// app.get('/auth/facebook/secrets',
//   passport.authenticate('facebook', { failureRedirect: '/login' }),
//   function(req, res) {
//     // Successful authentication, redirect home.
//     res.redirect('/secrets');
//   });

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});


app.get("/secrets", function(req, res){

  User.find({"secret": {$ne: null}}).then (function(foundUser, err){
    if(foundUser){
      res.render("secrets", {usersWithSecrets: foundUser});
    }else{
      console.log(err);
    }
    
    
  });
});

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
});

app.post("/submit",function(req, res){
  const submittedSecret = req.body.secret;

  console.log(req.user.id);
  User.findById(req.user.id).then(function(foundUser, err){
    if(foundUser){
      foundUser.secret = submittedSecret;
      foundUser.save().then(function () {
        res.redirect("/secrets");
      });
    }else{
        console.log(err);
      }
        
    
    
  });
});

app.get("/logout", function(req, res) {
  req.logout(function(err) {
    if (err) {
      console.log(err);
    }
    res.redirect("/");
  });
});

app.post("/register", function(req,res){
 
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    
  }else{
    passport.authenticate("local")(req, res, function() {
      res.redirect("/secrets");
    });
  }
});
});



app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
 req.login(user, function(err){
  if(err){
    console.log(err);
    res.render("login1.ejs");
  }else{
    passport.authenticate("local")(req, res, function(){
      res.redirect("/secrets");
    });
  }
 });
 
});
 
const port=3000;
app.listen(port, function() {
  console.log("Server started on port 3000");
});
