const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require('lodash');

const app = express();

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/todolistdb");
}

const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = mongoose.model("List", listSchema);

const Item1 = new Item({ name: "Welcome to your to-do list!" });
const Item2 = new Item({ name: "Click + to add more items" });
const Item3 = new Item({ name: "<-- Hit this to delete an item" });

const defaultItem = [Item1, Item2, Item3];

// async function fetchData() {
//     try {
//       const result = await Item.find({});
//       console.log(result);
//     } catch (error) {
//       console.log(error);
//     }rs
// };
// fetchData();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {

  Item.find({})
    .then((result) => {
      if (result.length === 0) {
        Item.insertMany(defaultItem)
          .then((result) => {
            console.log("Documents inserted:", result);
          })
          .catch((error) => {
            console.error("Error inserting documents:", error);
          });
        res.redirect("/");
      } else {
        res.render("list", { title: "Today", items: result });
      }
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/:name", (req, res) => {
  const name = _.capitalize(req.params.name);
  List.findOne({ name: name })
    .then((result) => {
      if (!result) {
        const list = new List({ name: name, items: defaultItem });
        list.save();
        res.redirect("/" + name);
      } else {
        res.render("list", { title: result.name, items: result.items });
      }
    })
    .catch((error) => {
      console.log(error);
    });
});

app.post("/", (req, res) => {
  const item = req.body.item;
  const name = req.body.list;
  const newItem = new Item({ name: item });
  if (name === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: name }).then((result) => {
      result.items.push(newItem);
      result.save();
      res.redirect("/" + name);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedId = req.body.checkbox;
  const name = req.body.listName;
  if (name === "Today") {
    Item.findByIdAndRemove(checkedId)
      .then((result) => {
        res.redirect("/");
        console.log("Deleted Successfully");
      })
      .catch((error) => {
        console.error("Error deleting document:", error);
      });
  } else {
    List.findOneAndUpdate({ name: name }, {$pull: {items: {_id: checkedId}}})
      .then((result) => {
        res.redirect("/"+name);
        console.log("Deleted Successfully");
      })
      .catch((error) => {
        console.error("Error deleting document:", error);
      });
  }
});

app.listen(3000, (req, res) => {
  console.log("Server is running on port 3000");
});
