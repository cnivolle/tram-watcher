const express = require("express");
const app = express();
const server = require("http").Server(app);
const WebSocket = require("ws")
const bodyParser = require("body-parser");
const path = require("path");
var Request = require("request");

server.listen(process.env.PORT || 8080);

const wsServer = new WebSocket.Server({
  server
});

app.use(bodyParser.text());

function getTimeFromResponse(time) {
  if (time.indexOf('mn') === -1) {
    return 0;
  }
  var seconds = parseInt(time.split('mn')[0]) * 60;
  if (time.slice(-2) !== "mn") {
    seconds += parseInt(time.split('mn')[1])
  }
  return seconds
}

retriveTimeleft();
setInterval(retriveTimeleft, 1000)

function getSecondsPoolTrams(station, direction, poolSize) {
  return new Promise((resolve, reject) => {
    Request.get(`http://open.tan.fr/ewp/tempsattente.json/${station}`, (error, response, body) => {
      if (error) {
        reject(`error: ${error}`)
      }
      const data = JSON.parse(body);
      const pool = []
      for (var i = 0; i < poolSize && i < data.length; i++) {
        const tram = data.filter(t => t.sens === direction)[i];
        const seconds = getTimeFromResponse(tram.temps);  
        pool.push(seconds)
      }
      resolve(pool)
    });
  })
}

function getSecondsTramsToCommerce(station, poolSize) {
  return getSecondsPoolTrams(station, 1, poolSize)  
}

function getSecondsTramsToBeaujoire(station, poolSize) {
  return getSecondsPoolTrams(station, 2, poolSize)  
}

function retriveTimeleft() {
  getSecondsTramsToCommerce("GSNO", 3)
    .then(seconds1 => {
      getSecondsTramsToBeaujoire("GSNO", 3)
      .then(seconds2 => {
        const response = `${JSON.stringify(seconds1)} ${JSON.stringify(seconds2)}`
        console.log(response)
        wsServer.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(response);
          }
        });
      })
      .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}

wsServer.on("connection", (ws, req) => {
  console.log("New wemos client detected");
});

wsServer.on('close', () => {
  console.log('disconnected');
});
