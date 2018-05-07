const express = require("express");
const app = express();
const server = require("http").Server(app);
const WebSocket = require("ws")
const bodyParser = require("body-parser");
const path = require("path");
const statsd = require('node-statsd');
const statsdMiddleware = require('express-statsd');
var Request = require("request");

const statsdClient = new statsd();
server.listen(process.env.PORT || 8080);

const wsServer = new WebSocket.Server({ server });

app.use(bodyParser.text());


function parseTime(time) {
  if (time.indexOf('mn') === -1) {
    return 0;
  }
  return parseInt(time.split('mn')[0]) * 60 + (time.slice(-2) === "mn" ? 0 : parseInt(time.split('mn')[1]))
}
retriveTimeleft(1);
setInterval(retriveTimeleft, 3000, 1)


function retriveTimeleft(tramDirection) {
  Request.get("http://open.tan.fr/ewp/tempsattente.json/GSNO", (error, response, body) => {
    if (error) {
      return console.dir(error);
    }
    const data = JSON.parse(body);

    var next_1 = data.find(t => t.sens === tramDirection);

    // Checking if we can leave
    var time_left = parseTime(next_1.temps);
    if (time_left > 300) {
      time_left = 300;
    }
    console.log("temps affiché: " + next_1.temps + " et il est: " + new Date());
    //console.log("Prochain tram dans " + time_left + " secondes");
    const percent = time_left / 300;
    console.log("Percent: " + percent )
    wsServer.clients.forEach(function (client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(percent);
      }
    });
  });
}

wsServer.on("connection", function (ws, req) {
  statsdClient.increment('wemos_connections');
  console.log("new client");
});
