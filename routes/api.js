"use strict";

const crypto = require("crypto");
const mongoose = require("mongoose");

let isMongoConnected = false;

const memoryBooks = [];

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  comments: {
    type: [String],
    default: [],
  },
});

const Book = mongoose.models.Book || mongoose.model("Book", bookSchema);

async function connectMongo() {
  if (!process.env.DB) return false;

  if (isMongoConnected || mongoose.connection.readyState === 1) {
    return true;
  }

  await mongoose.connect(process.env.DB);

  isMongoConnected = true;
  return true;
}

function createId() {
  return crypto.randomBytes(12).toString("hex");
}

function memoryGetAllBooks() {
  return memoryBooks.map((book) => ({
    _id: book._id,
    title: book.title,
    commentcount: book.comments.length,
  }));
}

function memoryGetBook(id) {
  return memoryBooks.find((book) => book._id === id);
}

module.exports = function (app) {
  app
    .route("/api/books")

    .get(async function (req, res) {
      try {
        const hasMongo = await connectMongo();

        if (!hasMongo) {
          return res.json(memoryGetAllBooks());
        }

        const books = await Book.find({}).lean();

        const result = books.map((book) => ({
          _id: book._id.toString(),
          title: book.title,
          commentcount: book.comments.length,
        }));

        return res.json(result);
      } catch (err) {
        return res.status(500).json({ error: "database error" });
      }
    })

    .post(async function (req, res) {
      const title = req.body.title;

      if (!title) {
        return res.type("text").send("missing required field title");
      }

      try {
        const hasMongo = await connectMongo();

        if (!hasMongo) {
          const newBook = {
            _id: createId(),
            title,
            comments: [],
          };

          memoryBooks.push(newBook);

          return res.json({
            _id: newBook._id,
            title: newBook.title,
          });
        }

        const newBook = await Book.create({
          title,
          comments: [],
        });

        return res.json({
          _id: newBook._id.toString(),
          title: newBook.title,
        });
      } catch (err) {
        return res.status(500).json({ error: "database error" });
      }
    })

    .delete(async function (req, res) {
      try {
        const hasMongo = await connectMongo();

        if (!hasMongo) {
          memoryBooks.length = 0;
          return res.type("text").send("complete delete successful");
        }

        await Book.deleteMany({});

        return res.type("text").send("complete delete successful");
      } catch (err) {
        return res.status(500).json({ error: "database error" });
      }
    });

  app
    .route("/api/books/:id")

    .get(async function (req, res) {
      const bookid = req.params.id;

      try {
        const hasMongo = await connectMongo();

        if (!hasMongo) {
          const book = memoryGetBook(bookid);

          if (!book) {
            return res.type("text").send("no book exists");
          }

          return res.json({
            _id: book._id,
            title: book.title,
            comments: book.comments,
          });
        }

        if (!mongoose.Types.ObjectId.isValid(bookid)) {
          return res.type("text").send("no book exists");
        }

        const book = await Book.findById(bookid).lean();

        if (!book) {
          return res.type("text").send("no book exists");
        }

        return res.json({
          _id: book._id.toString(),
          title: book.title,
          comments: book.comments,
        });
      } catch (err) {
        return res.status(500).json({ error: "database error" });
      }
    })

    .post(async function (req, res) {
      const bookid = req.params.id;
      const comment = req.body.comment;

      if (!comment) {
        return res.type("text").send("missing required field comment");
      }

      try {
        const hasMongo = await connectMongo();

        if (!hasMongo) {
          const book = memoryGetBook(bookid);

          if (!book) {
            return res.type("text").send("no book exists");
          }

          book.comments.push(comment);

          return res.json({
            _id: book._id,
            title: book.title,
            comments: book.comments,
          });
        }

        if (!mongoose.Types.ObjectId.isValid(bookid)) {
          return res.type("text").send("no book exists");
        }

        const book = await Book.findById(bookid);

        if (!book) {
          return res.type("text").send("no book exists");
        }

        book.comments.push(comment);
        await book.save();

        return res.json({
          _id: book._id.toString(),
          title: book.title,
          comments: book.comments,
        });
      } catch (err) {
        return res.status(500).json({ error: "database error" });
      }
    })

    .delete(async function (req, res) {
      const bookid = req.params.id;

      try {
        const hasMongo = await connectMongo();

        if (!hasMongo) {
          const index = memoryBooks.findIndex((book) => book._id === bookid);

          if (index === -1) {
            return res.type("text").send("no book exists");
          }

          memoryBooks.splice(index, 1);

          return res.type("text").send("delete successful");
        }

        if (!mongoose.Types.ObjectId.isValid(bookid)) {
          return res.type("text").send("no book exists");
        }

        const deletedBook = await Book.findByIdAndDelete(bookid);

        if (!deletedBook) {
          return res.type("text").send("no book exists");
        }

        return res.type("text").send("delete successful");
      } catch (err) {
        return res.status(500).json({ error: "database error" });
      }
    });
};