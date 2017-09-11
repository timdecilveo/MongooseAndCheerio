/* Showing Mongoose's "Populated" Method
 * =============================================== */

// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require('express-handlebars');
// Requiring our Note, Article, and Description models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
var Description = require("./models/Description.js");

// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

// Initialize Express
var app = express();

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));

// Make public a static dir
app.use(express.static("public"));

// Database configuration with mongoose
var collections = [];
mongoose.connect("mongodb://localhost/wsjdb", collections);
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});

//Main Handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Index Handlebars
app.get("/", function(req, res) {
  res.redirect('/index');
});
app.get('/index', function (req, res) {
    res.render("index");
  });



// A GET request to scrape the echojs website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("http://www.nytimes.com/", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function(i, element) {

      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");
      result.id = $(this).children("_id").text();

      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function(err, doc) {
        if (err) {
          console.log(err);
        }
        // Or log the doc
        else {
          console.log(doc);
        }
      });

    });
  });
  // Tell the browser that we finished scraping the text
  res.send("Scrape Complete");
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(doc);
    }
  });
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  .exec(function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(doc);
    }
  });
});


// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          res.send(doc);
          // console.log(doc.title)
        }
      });
    }
  });
});

// // Delete One from the DB
app.delete("/delete/:id", function(req, res) {
  // Delete the current note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And delete the new note the db
  newNote.remove(function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          res.send(doc);
          // console.log(doc.title)
        }
      });
    }
  });
});

// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});