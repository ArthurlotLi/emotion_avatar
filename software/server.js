/*
  server.js
  
  Primary file for our node.js express web application.
*/

const express = require("express");
const path = require("path");
var session = require('express-session')

const listeningPort = 80;

// Create the app
const app = express();

/*
  Web Application logic
*/

// Basic user statistics
var uniqueSessions = 0;
var views = 0;
var samplesListened = 0;

// Whenever the request path has "static" inside of it, simply serve 
// the static directory as you'd expect. 
app.use("/static", express.static(path.resolve(__dirname, "public", "static")));
// Serve all assets. 
app.use("/assets", express.static(path.join(__dirname, "assets")));
// To support parsing of JSON objects in both body and url. 
app.use(express.json({limit: '50mb', extended: true}));
app.use(express.urlencoded({
  extended: true
}));

// To support parsing of JSON objects in both body and url. 
//app.use(express.json({limit: '50mb', extended: true}));
//app.use(express.urlencoded({
//  extended: true
//}));

// Session Setup
app.use(session({
  // Secrete key for the session.
  secret: 'emotion avatar cat',
  resave: false,
  // Forces a session that is "uninitialized"
  // to be saved to the store
  saveUninitialized: true,
  cookie: { secure: false }
}))

const log_statistics = function(){
  console.log(`[INFO] ${new Date().toISOString()} | Unique Sessions: ${uniqueSessions} | Views: ${views} | Samples: ${samplesListened}`)
}

// For the main (and only) page, serve the web application to the client. 
app.get('/',(req,res) => {
  views++;
  if (req.session.views) {
    // Old session. 
    req.session.views++
  } 
  else{
    // New session has started
    uniqueSessions++;
    req.session.views = 1;
  }
  log_statistics();
  res.sendFile(path.resolve(__dirname, "public", "index.html"));
});

// Simple APIs to increment statistics counters.
app.get('/listenSample', (req, res) =>{
  samplesListened++;
  //log_statistics();
  return res.status(200).send();
});

// Start the server to listen on this port.
app.listen(listeningPort, () => {
  console.log("Project Tales of Skits is online at port: " +listeningPort);
});
