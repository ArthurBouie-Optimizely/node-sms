'use strict';
const bodyParser = require('body-parser'),
      optimizely = require('optimizely-server-sdk'),
         express = require('express'),
         request = require('request-promise'),
          twilio = require('twilio'),
            uuid = require('uuid/v4');

// REPLACE WITH YOUR OWN FULL STACK PROJECT ID
const projectId = '8727974816';
const datafileUrl = `https://cdn.optimizely.com/json/${projectId}.json`;

let optimizelyClient;

// Initialize Optimizely client when the server starts
request({uri: datafileUrl, json: true}).then((datafile) => { 
  console.log('Initializing Optimizely Client with Datafile: ', datafile);
  optimizelyClient = optimizely.createInstance({
    datafile: datafile
  });
});

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

// Index route for basic landing page
app.get('/', (req, res) => {
  res.send('Node SMS Full Stack Demo');
});

// Webhook URL for SMS
app.post('/sms-webhook', (req,res)=>{
  
  // msg grabs the message that the user originally sent to the SMS chat
  let msg = req.body.Body.toLowerCase();
  let twiml = new twilio.twiml.MessagingResponse();

  // Generate random user id to simulate random bucketing
  // Alternatively you could use the users number as a user id via req.body.From
  let userId = uuid();
  let fromNumber = req.body.From;

  // Replace with your own experiment_key
  let variation = optimizelyClient.activate('WELCOME_MESSAGING_TEST', userId);
  let response = 'Welcome to Optimizely. I hope you are to experiment.';

  console.log('Bucketed in variation ', variation);

  // Replace variations with your own variation_keys from your experiment
  if (variation === 'professionalM') {
    twiml.message(response);
  } else if (variation === 'personalM') {
    // Changes the response if user is bucketed into the variation
    response = 'Hey hope you are having a great day. Are you ready to optimize!';
    twiml.message(response);
  } else {
    twiml.message(response);
  }

  // Example of sending a track event with Optimizely
  optimizelyClient.track('sent_msg', userId);

  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

app.listen(process.env.PORT || 3000, function(){
  console.log("Up and running - check localhost:3000 for local environment");
});