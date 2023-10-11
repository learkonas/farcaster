const express = require('express');
const app = express();
const https = require('https');

//app.get('/data', (req, res) => {
  https.get('https://fnames.farcaster.xyz/transfers?from_ts=1697069669', (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      console.log(JSON.parse(data)); // Log the data to the console
      //res.send(data);
    });

  }).on('error', (error) => {
    console.error(error);
  });
//});

//app.listen(3000, () => console.log('Server running on port 3000'));

