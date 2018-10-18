var http = require("http");
var https = require("https");

/**
 * getJSON:  REST get request returning JSON object(s)
 * @param options: http options object
 * @param callback: callback to pass the results JSON object(s) back
 */
exports.getJSON = function(options, onResult)
{
    console.log(`Options: ${options}`);
    var port = options.port == 443 ? https : http;
    var req = port.request(options, function(res)
    {
        var output = '';
        res.setEncoding('utf8');

        res.on('data', (chunk)=>{
          output += chunk;
        });

        res.on('end', ()=>{
          var obj = JSON.parse(output);
          onResult(res.statusCode, obj);
          req.end();
        });

        res.on('error', ()=>{
          res.send('error: ' + err.message);
          req.end();
        });
    });

    req.on('error', (err)=>{
        console.log(err);
        req.end();
    });
    
};
