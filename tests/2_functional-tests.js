const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  let firstBookId;
  let secondBookId;

  suiteSetup(function (done) {
    chai
      .request(server)
      .delete("/api/books")
      .end(function () {
        done();
      });
  });

  test("Create a book with title: POST request to /api/books", function (done) {
    chai
      .request(server)
      .post("/api/books")
      .send({ title: "Test Book One" })
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.equal(res.body.title, "Test Book One");
        assert.property(res.body, "_id");

        firstBookId = res.body._id;
        done();
      });
  });

  test("Create another book with title: POST request to /api/books", function (done) {
    chai
      .request(server)
      .post("/api/books")
      .send({ title: "Test Book Two" })
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.equal(res.body.title, "Test Book Two");
        assert.property(res.body, "_id");

        secondBookId = res.body._id;
        done();
      });
  });

  test("Create a book without title: POST request to /api/books", function (done) {
    chai
      .request(server)
      .post("/api/books")
      .send({})
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.equal(res.text, "missing required field title");
        done();
      });
  });

  test("View all books: GET request to /api/books", function (done) {
    chai
      .request(server)
      .get("/api/books")
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtLeast(res.body.length, 2);
        assert.property(res.body[0], "_id");
        assert.property(res.body[0], "title");
        assert.property(res.body[0], "commentcount");

        done();
      });
  });

  test("View single book with no comments: GET request to /api/books/{_id}", function (done) {
    chai
      .request(server)
      .get(`/api/books/${firstBookId}`)
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.equal(res.body._id, firstBookId);
        assert.equal(res.body.title, "Test Book One");
        assert.isArray(res.body.comments);
        assert.lengthOf(res.body.comments, 0);

        done();
      });
  });

  test("View single book with invalid id: GET request to /api/books/{_id}", function (done) {
    chai
      .request(server)
      .get("/api/books/invalidid")
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.equal(res.text, "no book exists");
        done();
      });
  });

  test("Add a comment to a book: POST request to /api/books/{_id}", function (done) {
    chai
      .request(server)
      .post(`/api/books/${firstBookId}`)
      .send({ comment: "Great book" })
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.equal(res.body._id, firstBookId);
        assert.equal(res.body.title, "Test Book One");
        assert.isArray(res.body.comments);
        assert.include(res.body.comments, "Great book");

        done();
      });
  });

  test("Add a comment without comment field: POST request to /api/books/{_id}", function (done) {
    chai
      .request(server)
      .post(`/api/books/${firstBookId}`)
      .send({})
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.equal(res.text, "missing required field comment");
        done();
      });
  });

  test("Add a comment to invalid book id: POST request to /api/books/{_id}", function (done) {
    chai
      .request(server)
      .post("/api/books/invalidid")
      .send({ comment: "Invalid comment" })
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.equal(res.text, "no book exists");
        done();
      });
  });

  test("Delete a book: DELETE request to /api/books/{_id}", function (done) {
    chai
      .request(server)
      .delete(`/api/books/${secondBookId}`)
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.equal(res.text, "delete successful");
        done();
      });
  });

  test("Delete a book with invalid id: DELETE request to /api/books/{_id}", function (done) {
    chai
      .request(server)
      .delete("/api/books/invalidid")
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.equal(res.text, "no book exists");
        done();
      });
  });

  test("Delete all books: DELETE request to /api/books", function (done) {
    chai
      .request(server)
      .delete("/api/books")
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.equal(res.text, "complete delete successful");
        done();
      });
  });
});