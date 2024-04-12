const { v4: generateId } = require("uuid");
const database = require("./database");
var logger = require('../log');

exports.getTodos = async (req, res) => {
  const { today_date, skip } = req.query;
  try {
    const todos = database.client.db("todos").collection("todos");
    let filter = {};
    if (today_date) filter = { ...filter, due_date: today_date };
    const response = await todos.find(filter, { limit: 20, skip: skip ? +skip : 0 }).sort({ index: 1 }).toArray()
    res.status(200);
    res.json(response);
  } catch (error) {
    logger.error("while feching todos");
    res.status(500).send(error);
  }
};

exports.addTodo = async (req, res) => {
  try {
    const { text, dueDate, today_date } = req.body;
    if (typeof text !== "string") {
      res.status(400);
      logger.warn("invalid 'text' expected string");
      res.json({ message: "invalid 'text' expected string" });
      return;
    }
    if (new Date(dueDate) < new Date(today_date)) {
      res.status(400);
      res.error({ message: "invalid 'date'" });
      return;
    }
    //   const rrr = await database.client.db("todos").getCollection('todos').aggregate([

    // ])
    const rrr = await database.client.db("todos").collection("todos")
      .find().sort({ index: -1 }).limit(1).toArray()
    // .aggregate([{ $group: { _id: "1", max_index: { $max: "$index" } } }]).toArray()

    // const rrr = await database.client.db("todos").collection("todos").find( {
    //   $group: {
    //     maxIndex: {$max: "index"}
    //   }
    // }).toArray();
    console.log("--------------------------------------------------", rrr)
    const todo = {
      id: generateId(),
      text,
      completed: false,
      due_date: dueDate,
      index: rrr[0]?.index ? rrr[0].index + 1 : 0
    };

    const response = await database.client.db("todos").collection("todos").insertOne(todo);
    logger.info("todo has been added", response);
    res.status(201);
    res.json(todo);
  } catch (error) {
    logger.error("error while adding todo", error);
    res.status(500).send(error);
  }
};

exports.deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await database.client.db("todos").collection("todos").deleteOne({ id });
    logger.warn("todo has been deleted", response);
    res.status(203);
    res.end();
  } catch (error) {
    logger.error("error while deleting todo", error);
    res.status(500).send(error);
  }
};

exports.updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    if (typeof completed !== "boolean") {
      res.status(400);
      logger.error("invalid 'completed' expected boolean");
      res.json({ message: "invalid 'completed' expected boolean" });
      return;
    }

    const response = await database.client
      .db("todos")
      .collection("todos")
      .updateOne({ id }, { $set: { completed: completed } });
    logger.info("todo has been updated", response);
    res.status(200);
    res.end();
  } catch (error) {
    logger.error("error while updating todo", error);
    res.status(500).send(error);
  }
};

exports.reOrderTodo = async (req, res) => {
  const { si, di } = req.body
  try {
    // const upone = await database.client
    // .db("todos")
    // .updateOne({ index:1 }, { $set: { index: 3 } });
    let incval = -1
    let con = [{ index: { $gt: si } }, { index: { $lte: di } }]
    if (si === di) {
      return;
    } else if (si > di) {
      con = [{ index: { $lt: si } }, { index: { $gte: di } }]
      incval = 1
    }
    const upmany = await database.client
      .db("todos")
      .collection("todos").updateMany(
        { $and: con },
        { $inc: { "index": incval } }
      );

    const upone = await database.client.db("todos").collection("todos").updateOne({ index: si }, { $set: { "index": di } });

    logger.info("todo reordered", upmany);
    res.status(200);
    res.send(rrr);
  } catch (error) {
    console.log("eeeeeeeeeeeeeerrrorrrrrrrrrrrrrrrrrrrrRRRr", error)
    logger.error("error while updating todo", error);
    res.status(500).send(error);
  }
};
