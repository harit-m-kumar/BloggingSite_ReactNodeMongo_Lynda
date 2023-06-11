const http = require("http");
//create a server object: 

console.log(environment);
http
    .createServer(function (req, res) {
        res.write("<h1>Hello World!</h1>");
        //write a response to the client 

        res.end();
        //end the response 
    })
    .listen(8080);  