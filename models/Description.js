// Require mongoose
var mongoose = require("mongoose");
// Create a schema class
var Schema = mongoose.Schema;

// Create the Description schema
var DescriptionSchema = new Schema({
  // Just a string
  title: {
    type: String
  },
  // Just a string
  body: {
    type: String
  }
});

// Create the Description model with the DescriptionSchema
var Description = mongoose.model("Description", DescriptionSchema);

// Export the Note model
module.exports = Description;