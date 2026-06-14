"use strict";

const crypto = require("crypto");

const books = [];

function createId() {
  return crypto.randomBytes(12).toString("hex");
}

module.exports = function (app) {
  app
    .route("/api/books")

    .get(function (req, res) {
      const result = books.map((book) => ({
        _id: book._id,
        title: book.title,
        commentcount: book.comments.length,
      }));

      res.json(result);
    })

    .post(function (req, res) {
      const title = req.body.title;

      if (!title) {
        return res.type("text").send("missing required field title");
      }

      const newBook = {
        _id: createId(),
        title,
        comments: [],
      };

      books.push(newBook);

      res.json({
        _id: newBook._id,
        title: newBook.title,
      });
    })

    .delete(function (req, res) {
      books.length = 0;
      res.type("text").send("complete delete successful");
    });

  app
    .route("/api/books/:id")

    .get(function (req, res) {
      const bookid = req.params.id;
      const book = books.find((item) => item._id === bookid);

      if (!book) {
        return res.type("text").send("no book exists");
      }

      res.json({
        _id: book._id,
        title: book.title,
        comments: book.comments,
      });
    })

    .post(function (req, res) {
      const bookid = req.params.id;
      const comment = req.body.comment;

      if (!comment) {
        return res.type("text").send("missing required field comment");
      }

      const book = books.find((item) => item._id === bookid);

      if (!book) {
        return res.type("text").send("no book exists");
      }

      book.comments.push(comment);

      res.json({
        _id: book._id,
        title: book.title,
        comments: book.comments,
      });
    })

    .delete(function (req, res) {
      const bookid = req.params.id;
      const index = books.findIndex((item) => item._id === bookid);

      if (index === -1) {
        return res.type("text").send("no book exists");
      }

      books.splice(index, 1);

      res.type("text").send("delete successful");
    });
};