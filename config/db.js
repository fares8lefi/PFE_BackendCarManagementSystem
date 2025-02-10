const mongoose = require("mongoose");

module.exports.connectToDb = async (req, res) => {
  mongoose.set("strictQuery", false);
  mongoose
    .connect(process.env.db_url)
    .then(() => {
      console.log("Connected successfully to the database");
    })
    .catch((err) => {
      console.log(err);
    });
};
