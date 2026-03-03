// REQUIRES
const express = require("express");
const app = express();
app.use(express.json());
const fs = require("fs");

// we are mapping file system paths to the app's virtual paths
app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/img", express.static("./public/images"));
app.use("/icon", express.static("./public/icons"));
app.use("/font", express.static("./public/fonts"));
app.use("/components", express.static("./src/components"))

app.get("/", function (req, res) {
    //console.log(process.env);
    // retrieve and send an HTML document from the file system
    let doc = fs.readFileSync("./index.html", "utf8");
    res.send(doc);
});

app.get("/mapInfor", function (req, res) {
});

app.get("/challenges", function (req, res) {

    let doc = fs.readFileSync("./app/html/challenges.html", "utf8");

    // just send the text stream
    res.send(doc);

});

app.get("/shop", function (req, res) {

    let doc = fs.readFileSync("./app/html/itemshop.html", "utf8");

    // just send the text stream
    res.send(doc);

});



// for resource not found (i.e., 404)
app.use(function (req, res, next) {
    res.status(404).send("<html><head><title>Page not found!</title></head><body><p>Nothing here.</p></body></html>");
});

// RUN SERVER
let port = 8000;
app.listen(port, function () {
    console.log("Example app listening on port " + port + "!");
});
