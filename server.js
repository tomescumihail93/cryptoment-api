const express = require('express');
var cfenv = require('cfenv');
const app = express();


app.get('/test', (req, res) => res.send('Hello World!'))

var appEnv = cfenv.getAppEnv();
app.listen(appEnv.port, () => console.log('Example app listening on port 3000!'))