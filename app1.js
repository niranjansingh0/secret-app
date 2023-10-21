//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs =require("ejs");
const mongoose = require('mongoose');
// const encrypt =require ("mongoose-encryption");
// const md5 =require("md5");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const app = express();

// console.log(process.env.API_KEY);

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/userDB");
  
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

app.use(express.static("public"));
app.set('view engine','ejs');
app.use (bodyParser.urlencoded({extended:true}));

const userSchema =new mongoose.Schema({
  email: String,
  password: String
});

// const secret ="Thisisourlittlesecret.";

// userSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields: ["password"]});


const User =new mongoose.model("User",userSchema);

app.get("/",function(req,res){
    res.render("home");

});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register", function(req,res){
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    const newUser =new User ({
      email:req.body.username,
      password:hash
    });
     newUser.save().then(function(err){
      if(err){
        console.log(err);
      }
    });
    res.render("secrets");
  });
});


app.post("/login", function(req,res){
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username}).then(function(foundUser,err){
    // const data= foundUser.password;
    
    if(foundUser){
      // if(foundUser.password === password){
        bcrypt.compare(password, foundUser.password, function(err, result) {
          if(result === true){
            res.render("secrets");
            
          }else{
            console.log(err);
            res.render("login1.ejs");
          }
        });
      
      }
    // res.render("login.ejs",data);
  });
  
 
  
});
const port=3000;
app.listen(port, function() {
  console.log("Server started on port 3000");
});
