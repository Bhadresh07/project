//jshint esversion:6
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require("cookie-parser");
const LocalStrategy = require("passport-local");
const College = require("./models/college");
const Review = require("./models/review");
const User = require("./models/user");
const Bcrypt = require('bcryptjs');
const ejsLint = require('ejs-lint');
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + "/public"));
mongoose.connect("mongodb://localhost:27017/college", {
  useNewUrlParser: true
});
mongoose.set('useCreateIndex', true);
app.use(require("express-session")({
  secret: "hello",
  resave: false,
  saveUninitialized: false
}));
app.use(cookieParser('secret'));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});
app.get("/index", function(req, res){
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        College.find({cname: regex}, function(err,colleges){
           if(err){
               console.log(err);
           } else {
              if(colleges.length < 1) {
                  noMatch = "No colleges match that query, please try again.";
              }
              res.render("index",{colleges:colleges, error_msg: noMatch});
           }
        });
    } else {
        College.find({}, function(err, colleges){
           if(err){
               console.log(err);
           } else {
              res.render("index",{colleges:colleges, error_msg: noMatch});
           }
        });
    }
});
app.get("/", function(req, res) {
  res.render("home");
});
app.get("/home", function(req, res) {
  res.render("home");
});
app.get("/login", function(req, res) {
  res.render("login");
});
app.get("/signup", function(req, res) {
  res.render("signup");
});
app.get("/add_college", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("addcollege");
  } else {
    return res.render("login", {
      error: "You need to login first!"
    });
  }
});
app.get("/admin", function(req, res) {
  if (req.user.isAdmin) {
    College.find({}, function(err, coll) {
      res.render("admin", {
        coll: coll
      });
    });
  } else {
    res.render("404", {
      error: "Not Found"
    });
  }
});
app.get("/college", function(req, res) {
  College.find({}, function(err, colleges) {
    res.render("college", {
      colleges: colleges
    });
  });
});
app.get("/profile", function(req, res) {
  res.render("profile");
});
app.get("/review", function(req, res) {
  Review.find({}, function(err, rev) {
    res.render("review", {
      rev: rev
    });
  });
});
app.get("/write_review", function(req, res) {
  if (req.isAuthenticated()) {
    College.find({}, function(err, colleges) {
      res.render("wreview", {
        colleges: colleges
      });
    });
  } else {
    return res.render("login", {
      error: "You need to login first!"
    });
  }
});
app.post("/signup", function(req, res) {
  const password = req.body.password;
  const cpassword = req.body.cpassword;
  if (password === cpassword) {
    const user = new User({
      name: req.body.name,
      username: req.body.username,
      email: req.body.email,
      password: Bcrypt.hashSync(req.body.password, 10)
    });
    if (req.body.username == "admin") {
      user.isAdmin = true;
    }
    User.register(user, req.body.password, function(err, user) {
      if (err) {
        return res.render("signup", {
          error: err.message
        });
      }
      passport.authenticate("local")(req, res, function() {
        req.flash("success", "Successfully Signed Up!" + req.body.username);
        res.redirect("/user");
      });
    });
  } else {
    return res.render("signup", {
      error: "password did not matched!"
    });
  }
});
app.post("/write_review", function(req, res) {

  var author = {
    id: req.user._id,
    username: req.user.username
  };
  const review = new Review({
    cname: req.params.cname,
    batch: req.body.batch,
    rating: req.body.rating,
    title: req.body.title,
    author: author,
    review: req.body.review
  });

  review.save();
  res.redirect("review");

});
app.post("/add_college", function(req, res) {
  var author = {
    id: req.user._id,
    username: req.user.username
  };
  const college = new College({
    cname: req.body.cname,
    location: req.body.location,
    course: req.body.course,
    designation: req.body.designation,
    about: req.body.about,
    author: author
  });
  college.save();
  res.redirect("college");
});
app.post("/login", passport.authenticate("local", {
  successRedirect: "/dashboard",
  failureRedirect: "login",
  failureFlash: true,
}), function(req, res) {
  res.redirect('/user');
});
app.get("/dashboard", function(req, res) {
  if (req.isAuthenticated()) {
    if (req.user.isAdmin) {
      College.find({}, function(err, coll) {
        res.render("admin", {
          add: coll
        });
      });
    } else {
      res.redirect("review");
    }
  } else {
    res.render("login", {
      error: "You need to login first!"
    });
  }
});
app.get("/user", function(req, res) {
  res.render("user");
});
app.get("/logout", function(req, res) {
  req.logout();
  req.flash("success", "Successfully logged out!");
  res.redirect("/");
});

app.get('/accept/:cname', function(req, res) {
  let cname = req.params.cname;
  College.findOneAndUpdate({
    cname: cname
  }, {
    $set: {
      validity: true
    }
  }, function(err,college) {
    if (err) {
      req.render('dashboard', {
        error_msg: err
      });
    }
    if (college) {
      console.log(college);
      req.flash('success_msg', 'Successfully Added');
      res.redirect('/college');
    }
  });
});
app.get('/reject/:cname', function(req, res) {
  var cname = req.params.cname;
  College.findOneAndUpdate({
    cname: cname
  }, {
    $set: {
      validity: false
    }
  }, function(err, college) {
    if (err) {
      req.render('dashboard', {
        error_msg: err
      });
    }
    if (college) {
      console.log(college);
      req.flash('success_msg', 'Successfully Added');
      res.redirect('/college');
    }
  });
});
app.get('/review/:cname', function(req, res) {
  req.redirect('wreview1');
  });
app.get('/college/:cname', function(req, res) {
  College.findOne({
    cname: req.params.cname
  }, function(err, college) {
    if (err) {
      req.render('college', {
        error_msg: err
      });
    } else if (college) {
      console.log(college);
      res.render("college1", {
        college: college
      });
    } else {
      res.render("college1", {
        college: "Nothing to show"
      });
    }
  });
});
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
app.listen(3000, function() {
  console.log("server started at port 3000");
});
module.exports = router;
