const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const app = express();
const multer = require("multer");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const nodemailer = require("nodemailer");
let randomString = "";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "autospectrashowroom@gmail.com",
    pass: "qukn oacr qwkm nxef",
  },
});

const CarSchema = require("./carSchema");
const UserSchema = require("./userSchema");

const generateRandomString = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

mongoose
  .connect("mongodb+srv://zain:zain@stack.joiua6t.mongodb.net/AutoSpectra", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  .then(() => {
    console.log("Connected");
  })
  .catch((err) => {
    console.log(err);
  });

app.post("/Login", (req, res) => {
  const { userEmail, userPassword } = req.body;

  console.log(userPassword);
  UserSchema.findOne({ email: userEmail }).then((data) => {
    console.log(data);

    if (data) {
      bcryptjs.compare(userPassword, data.password, (err, result) => {
        if (err) {
          console.error("Error comparing passwords:", err);
          return;
        }
        if (result) {
          res.send({ message: "Logged" });
        } else {
          res.send({ message: "Password Incorrect" });
        }
      });
    } else {
      res.send({ message: "User Not Registerd" });
    }
  });
});

app.post("/accountVerification", (req, res) => {
  const { userEmail } = req.body;
  console.log(userEmail);
  UserSchema.findOne({ email: userEmail }).then((data) => {
    if (data) {
      res.send({ message: "Already Created" });
    } else {
      randomString = generateRandomString();
      console.log(randomString);
      const mailOptions = {
        from: "autospectrashowroom@gmail.com",
        to: userEmail,
        subject: "Account Verification",
        text:
          "Please Use the Code On Application To verify the Account " +
          randomString,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          res.send({ message: "verification success" });
          console.log("Email sent: " + info.response);
        }
      });
    }
  });
});

app.post("/CreateAccount", (req, res) => {
  const { userName, userEmail, userPassword, userToken } = req.body;
  if (userToken === randomString) {
    bcryptjs.genSalt(10, (err, salt) => {
      bcryptjs.hash(userPassword, salt, (err, hash) => {
        if (err) {
          console.error(err);
          return;
        }

        const user = new UserSchema({
          uname: userName,
          email: userEmail,
          password: hash,
        });
        user.save().then((data) => {
          if (data) {
            res.send({ message: "User Created" });
          }
        });
      });
    });
  } else {
    res.send({ message: "Inncorrect Code" });
  }
});

app.post("/forgotPassowrd", (req, res) => {
  const { email } = req.body;
  console.log(email);
  UserSchema.findOne({ email: email }).then((data) => {
    if (data) {
      randomString = generateRandomString();
      console.log(randomString);

      const mailOptions = {
        from: "autospectrashowroom@gmail.com",
        to: email,
        subject: "Account Verification",
        text:
          "Please Use the Code On Application To Rest the Password " +
          randomString,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          res.send({ message: "verification success" });
          console.log("Email sent: " + info.response);
        }
      });
    } else {
      res.send({ message: "User not Found" });
    }
  });
});

app.post("/newPassword", (req, res) => {
  const { userEmail, userNewPassword, userToken } = req.body;
  console.log(userEmail);
  UserSchema.findOne({ email: userEmail }).then((data) => {
    if (data) {
      if (userToken === randomString) {
        bcryptjs.genSalt(10, (err, salt) => {
          bcryptjs.hash(userNewPassword, salt, (err, hash) => {
            if (err) {
              console.error(err);
              return;
            }

            UserSchema.findOneAndUpdate(
              { email: userEmail },
              { $set: { password: hash } },
              { new: true }
            ).then((updatedUser) => {
              if (updatedUser) {
                res.send({ message: "Password Updated" });
              } else {
                res.send({ message: "Inncorrect Code" });
              }
            });
          });
        });
      } else {
        res.send({ message: "Inncorrect Code" });
      }
    } else {
      res.send({ message: "Inncorrect Code" });
    }
  });
});

////////////////////////////////////////////////////////////////////////

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/uploadCar", upload.array("images", 3), async (req, res) => {
  try {
    const existingCar = await CarSchema.findOne({ carName: req.body.CarName });
    if (existingCar) {
      existingCar.brand = req.body.brand;
      existingCar.bodyType = req.body.bodyType;
      existingCar.transmission = req.body.Transmission;
      existingCar.fuelType = req.body.Fuel;
      existingCar.totalprice = req.body.Price;
      existingCar.year = req.body.Year;
      existingCar.description = req.body.Description;
      existingCar.images = req.files.map((file) => ({
        filename: file.originalname,
        base64: file.buffer.toString("base64"),
      }));
      await existingCar.save();
      res.send({
        message: "Car details updated",
      });
    } else {
      const newCar = await CarSchema.create({
        brand: req.body.brand,
        bodyType: req.body.bodyType,
        carName: req.body.CarName,
        transmission: req.body.Transmission,
        fuelType: req.body.Fuel,
        totalprice: req.body.Price,
        year: req.body.Year,
        description: req.body.Description,
        images: req.files.map((file) => ({
          filename: file.originalname,
          base64: file.buffer.toString("base64"),
        })),
      });
      res.send({
        message: "New car created",
      });
    }
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).send({
      message: "Internal Server Error",
    });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////

app.post("/GetCars", async (req, res) => {
  const carType = req.body.carType;

  if (
    carType === "Toyota" ||
    carType === "Honda" ||
    carType === "KIA" ||
    carType === "Suzuki" ||
    carType === "Audi"
  ) {
    const cars = await CarSchema.find({ brand: { $eq: carType } });
    if (cars.length === 0) {
      console.log("No cars found for the specified brand.");
      res.json({ message: "No cars found for the specified type" });
    } else {
      res.json(cars);
      console.log(cars.images);
    }
  } else if (
    carType === "Compact Sedan" ||
    carType === "Convertible" ||
    carType === "Crossover" ||
    carType === "Sedan" ||
    carType === "HatchBack"
  ) {
    const cars = await CarSchema.find({ bodyType: { $eq: carType } });
    if (cars.length === 0) {
      console.log("No cars found for the specified brand.");
      res.json({ message: "No cars found for the specified type" });
    } else {
      res.json(cars);
    }
  } else {
    const cars = await CarSchema.find({});
    if (cars.length === 0) {
      console.log("No cars found for the specified brand.");
      res.json({ message: "No cars found for the specified type" });
    } else {
      res.json(cars);
      console.log(cars.images);
    }
  }
});

app.post("/FindCar", async (req, res) => {
  const carName = req.body.carName;

  const cars = await CarSchema.find({ carName: { $eq: carName } });
  console.log(cars);
  if (cars.length === 0) {
    console.log("No cars found for the specified brand.");
    res.json({ message: "No cars found for the specified type" });
  } else {
    res.json(cars);
  }
});

app.post("/DeleteCar", async (req, res) => {
  const carNameToDelete = req.body.carType;
  try {
    const result = await CarSchema.findOneAndDelete({
      carName: carNameToDelete,
    });

    if (result) {
      const result = await UserSchema.updateMany(
        { wishlist: { $elemMatch: { carName: carNameToRemove } } },
        { $pull: { wishlist: { carName: carNameToRemove } } }
      );
      res.send({ message: "Deleted" });
    } else {
      res.json({ message: `Car with carName ${carNameToDelete} not found` });
    }
  } catch (error) {}
});

app.post("/Getuser", async (req, res) => {
  const userEmail = req.body.userEmail;
  const user = await UserSchema.find({ email: { $eq: userEmail } });
  // const userName = user[0].uname;
  res.send(user);
});

app.post("/upi", upload.array("images", 3), async (req, res) => {
  try {
    const carName = req.body.carName;
    const existingCar = await CarSchema.findOne({ carName });
    if (existingCar) {
      ages;
      existingCar.images = req.files.map((file) => ({
        filename: file.originalname,
        base64: file.buffer.toString("base64"),
      }));
      await existingCar.save();
    } else {
      return res.status(404).json({ error: "Car not found" });
    }
    res.json({ message: "Car details updated" });
    console.log("updt");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/wishlist", async (req, res) => {
  const { useremail } = req.body;
  console.log(useremail);
  try {
    // Find the user by email
    const user = await UserSchema.findOne({ email: useremail });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract the wishlist from the user document
    const wishlist = user.wishlist;
    console.log(wishlist)

    // Array to store car data
    const carData = [];

    // Iterate over each item in the wishlist
    for (const item of wishlist) {
      const carName = item.carName;
      console.log(carName);
      // Search for the car in your CarSchema
      const car = await CarSchema.findOne({ carName: carName });
      if (car) {
        carData.push(car);
      }
    }

    console.log(carData)
    // Send the car data in the response
     res.send({ wishlist, carData });
  } catch (error) {
    console.error("Error processing wishlist:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.post("/favouritelist", async (req, res) => {
  const { useremail, wishlist } = req.body;
  try {
    const user = await UserSchema.findOne({ email: useremail });

    if (!user) {
      // If user doesn't exist, you might choose to create a new user or handle it differently
      return res.status(404).json({ error: "User not found" });
    }

    user.wishlist = wishlist;

    await user.save();

    res.status(201).json({ message: "Wishlist created/updated successfully" });
  } catch (error) {
    console.error("Error updating wishlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(4000, function () {
  console.log("Listening on Port 4000");
});

// ngrok http http://localhost:3000
