const express = require("express");
const app = express();

const cors = require("cors");

const userItem = require("./models/user");
const exerciseItem = require("./models/exercise");

const mongoose = require("mongoose");
mongoose.connect(
  process.env.MLAB_URI || "mongodb://localhost/exercise-track",
  { useNewUrlParser: true },
  () => {
    console.log("successfully connected to mongodb");
  }
);

app.use(cors());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// required routes
app.post("/api/exercise/new-user", (req, res) => {
  const newUser = new userItem({
    userName: req.body.username.toLowerCase()
  });

  newUser
    .save()
    .then(userData =>
      res.json({ username: userData.userName, _id: userData._id })
    )
    .catch(err =>
      res.json({ errorMessage: "User with this name already exists" })
    );
});

app.get("/api/exercise/users", (req, res) => {
  userItem.find({}, (err, users) => {
    res.json(users);
  });
});

// this middlewares checks whether the user exists or not.
// if it doesn't exist it responds with the error message
// if it does exist, then the user object is passed to the next middleware
// so that the exerciseItem can be created for that user.
function getUser(req, res, next) {
  userItem.find({ _id: req.body.userId }, (err, data) => {
    if (!err) {
      res.locals.user = data[0];
      next();
    } else {
      res.json({ err: "looks like user with this id doesn't exist" });
    }
  });
}

app.post("/api/exercise/add", getUser, (req, res) => {
  const { userId, description, duration, date } = req.body;
  const dateToBeStored = date !== "" ? new Date(date) : new Date();

  const exerciseCreated = {
    username: res.locals.user.userName,
    description: description,
    duration: duration,
    _id: userId,
    date: dateToBeStored
  };

  exerciseItem.find({ _id: userId }, (err, data) => {
    if (data.length !== 0) {
      const logItem = {
        description: description,
        duration: duration,
        date: dateToBeStored
      };

      // updating the document with the new exercise
      exerciseItem.findOneAndUpdate(
        { _id: userId },
        { $push: { log: logItem } }
      );
    } else {
      const newExercise = new exerciseItem({
        _id: userId,
        username: res.locals.user.userName,
        log: [
          {
            description: description,
            duration: duration,
            date: dateToBeStored
          }
        ]
      });

      // saves exercise data for the first time user
      newExercise.save();
    }
  });

  res.json(exerciseCreated);
});

app.get("/api/exercise/log", (req, res) => {
  exerciseItem.find({ _id: req.query.userId }, (err, data) => {
    if (data.length !== 0) res.json(data);
    else
      res.json({ errorMessage: "Looks like no exercises exist for this user" });
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res
    .status(errCode)
    .type("txt")
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
