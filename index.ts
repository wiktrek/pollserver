const express = require("express");
const mysql = require("mysql");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const poll = process.env.POLL;
const key = process.env.KEY;
const app = express();
const port = 8080;

interface Vote {
  vote: string;
  votes: number;
}
// db
var con = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB,
});
// WebSockets
const server = http.createServer(app);
const io = new Server(server);
io.on("connection", (socket) => {
  console.log("client connected", socket.id);
  socket.on("disconnect", () => console.log("User disconnected"));
});
// npm
app.get("/chart.js", (req, res) => {
  res.sendFile(path.join(__dirname, "node_modules/chart.js/dist/chart.umd.js"));
});

// Serve chartjs-plugin-datalabels
app.get("/chartjs-plugin-datalabels.js", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "node_modules/chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js"
    )
  );
});

app.get("/api/removevotes/:poll/:value", (req, res) => {
  const value = req.params["value"];
  const poll_to_delete = req.params["poll"];
  if (value === process.env.ADMIN_PASSWD) {
    con.query(
      "DELETE FROM vote WHERE poll = ?",
      [poll_to_delete],
      (err, result) => {
        console.log(result);
        if (err) {
          console.error(err);
          return res.status(500).send("Wystąpił błąd serwera");
        }
        return res.status(200).send("ez");
      }
    );
  }
  res.send("no");
});
app.get("/api/getpolldata", (req, res) => {
  res.send({
    status: 200,
    poll: poll as string,
    title: process.env.TITLE,
    options: process.env.OPTIONS,
  });
});
app.get("/api/vote/:vote/:voter/:value", (req, res) => {
  const value = req.params["value"];
  if (value != key) return res.status(401).send("brak klucza");
  const vote = req.params["vote"];
  const voter = req.params["voter"];
  /*
    zmien poll tu i w index.html
  */
  if (vote > 3 || vote < 0) return res.send("wartosci vote sa od 1 do 4");
  con.query(
    "SELECT * FROM vote WHERE voter = ? AND poll = ? LIMIT 1",
    [voter, poll],
    (err, result) => {
      console.log(result, result.length != 0);
      if (err) {
        console.error(err);
        return res.status(500).send("Wystąpił błąd serwera");
      }
      if (result.length != 0) {
        return res.status(400).send(`Juz glosowales na to glosowanie`);
      }
      const sql = `INSERT INTO vote (poll,vote, voter) VALUES (?, ?, ?)`;
      console.log("voting on", vote, voter, poll);
      con.query(sql, [poll, vote, voter], (err, result) => {
        if (err) throw err;
        console.log("Row inserted, ID:", result.insertId);
      });
      io.emit("update", "test");
      res.send({ status: 200 });
    }
  );
});
function getVotes(poll: string): Promise<Vote[]> {
  const sql = `SELECT vote, COUNT(*) AS vote_count FROM vote WHERE \`poll\` = ? GROUP BY vote;`;

  return new Promise((resolve, reject) => {
    con.query(sql, [poll], (err, results) => {
      if (err) return reject(err);
      const voteArray = results.map((row) => ({
        vote: row.vote,
        votes: row.vote_count,
      }));
      console.log(voteArray, poll);
      resolve(voteArray);
    });
  });
}
app.get("/api/chart/:poll", async (req, res) => {
  const poll = req.params["poll"];
  const votes = await getVotes(poll);
  res.status(200).json(votes);
});

// public
app.use(express.static("public"));
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
