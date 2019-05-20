var express = require('express');
var chalk = require('chalk');
var app = express();
var router = express.Router();
var myParser = require("body-parser");
var port = process.env.PORT || 80;
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var convert = require('xml-js');
var https = require('https');
var bodyParser = require('body-parser');
var xmlparser = require('express-xml-bodyparser');
var path = require("path");

var TICKETS_COLLECTION = "tickets";

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI || "mongodb://react:react-db1@ds143326.mlab.com:43326/heroku_n2xk0q9v", function (err, client) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = client.db();
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});


app.use(myParser.json({extended : true}));

var ticketAttributes = ["id", "created_at", "updated_at", "type", "subject", "description", "priority", "status", "recipient", "submitter", "assignee_id", "follower_ids", "tags"];


//List all JSON tickets 
router.get('/list', function(req, res) {
	 db.collection(TICKETS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get tickets.");
    } else {
      res.status(200).json(docs);
    }
  });
});

//Retrieve each ticket by ID endpoint 
router.get('/ticket/:id', function(req, res) {
	req.params.id = parseInt(req.params.id);
	db.collection(TICKETS_COLLECTION).findOne({ id:req.params.id }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get ticket");
    } else {
      res.status(200).json(doc);
    }
  });
});

//Retreive each ticket as XML by ID endpoint
router.get('/xml/ticket/:id', function(req, res) {
	req.params.id = parseInt(req.params.id);
	var options = {
	  host: 'robert-d-ticket-system.herokuapp.com',
	  path: '/rest/ticket/' + req.params.id
	};
	var body;
	var req = https.get(options, function(response) {
	  console.log('STATUS: ' + response.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(response.headers));

	  // Buffer the body entirely for processing as a whole.
	  var bodyChunks = [];
	  response.on('data', function(chunk) {
	    // You can process streamed parts here...
	    bodyChunks.push(chunk);
	  }).on('end', function() {
	    body = Buffer.concat(bodyChunks);
	    body = JSON.parse(body);
	    console.log('BODY: ' + body);
	    var options = {compact: true, ignoreComment: true, spaces: 4};
	    var result = convert.js2xml(body, options);
	    console.log('XML' + result);
	    res.status(200).send(result);
	  })
	});
	req.on('error', function(e) {
	  console.log('ERROR: ' + e.message);
	});
});	


//Update ticket by ID
router.put("/ticket/:id", function(req, res) {
  var updateTicket = req.body;
  delete updateTicket._id;
  req.params.id = parseInt(req.params.id);
  db.collection(TICKETS_COLLECTION).updateOne({id:req.params.id }, { $set: updateTicket}, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update ticket");
    } else {
      updateTicket.id = req.params.id;
      res.status(200).json(updateTicket);
    }
  });
});

//Delete ticket by ID
router.delete("/ticket/:id", function(req, res) {
	req.params.id = parseInt(req.params.id);
	db.collection(TICKETS_COLLECTION).deleteOne({id:req.params.id}, function(err, result) {
	if (err) {
	  handleError(res, err.message, "Failed to delete ticket");
	} else {
	  res.status(200).json(req.params.id);
	}
	});
});

router.post('/xml/', xmlparser({trim: false, explicitArray: false}), function(req, res, next) {
	console.log(req.body);
	res.status(200).send('Done');
	var data = req.body;
	console.log('JSON output' + JSON.stringify(data));
});

//Post XML to create endpoint
router.post('/xml/ticket/', xmlparser({trim: false, explicitArray: false}), function(req, res, next) {
	var data = req.body;
	data = {
		"id" : data.ticket.id,
		"created_at" : data.ticket.created_at,
		"updated_at" : data.ticket.updated_at,
		"type" : data.ticket.type,
		"subject" : data.ticket.subject,
		"description" : data.ticket.description,
		"priority" : data.ticket.priority,
		"status" : data.ticket.status,
		"recipient" : data.ticket.recipient,
		"submitter" : data.ticket.submitter,
		"assignee_id" : data.ticket.assignee_id,
		"follower_ids" : data.ticket.follower_ids,
		"tags" : data.ticket.tags
	};
	console.log(data);
	console.log(JSON.stringify(data));
	data = JSON.stringify(data);
	const options = {
	  hostname: 'robert-d-ticket-system.herokuapp.com',
	  path: '/rest/ticket',
	  method: 'POST',
	  headers: {
	    'Content-Type': 'application/json',
	    'Content-Length': data.length
	  }
	}

	const request = https.request(options, (response) => {
	  console.log(`statusCode: ${response.statusCode}`)

	  response.on('data', function(d) {
	    process.stdout.write(d)
	  })
	})

	request.on('error', (error) => {
	  console.error(error)
	})

	request.write(data)
	request.end()
	res.status(200).send('Done');
});

//Create ticket
//Post JSON tickets
router.post('/ticket', function(req, res) {
	var isValid = true;
	var numOfKeys = 0;
	var reqJSON = req.body;

	//For loop checks to see if the json object contains all of the necessary keys for a ticket
	for (var index in ticketAttributes) {
		if(!reqJSON.hasOwnProperty(ticketAttributes[index])){
			console.log("Does not have " + ticketAttributes[index]);
			res.write("JSON does not contain " + ticketAttributes[index] + " key. ");
			isValid = false;
		}
	}

	//Get number of keys from req JSON
	for(var index in reqJSON) {
		numOfKeys += 1
	}

	console.log("numOfKeys = " + numOfKeys);
	//Check for number of keys
	if (numOfKeys != 13) {
		console.log("Incorrect number of keys");
		res.write("Incorrect number of keys");
		isValid = false;
	}

	reqJSON.id = parseInt(reqJSON.id);
	console.log('reqJSON.id = ' + reqJSON.id);
	db.collection(TICKETS_COLLECTION).findOne({ id:reqJSON.id }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to check for existing ticket");
    } else {
    	console.log(doc);
      if (doc != null) {
      	isValid = false;
      	console.log('There is already a ticket with this id.');
      	res.write("There is already a ticket with this id.");
      }
    }
  });

	//If all is valid, push ticket to database
	if (isValid) {
		db.collection(TICKETS_COLLECTION).insertOne(reqJSON, function(err, doc) {
	      if (err) {
	        handleError(res, err.message, "Failed to create new ticket.");
	      } else {
	      	console.log('Pushed');
	      }
	    });
	}
	res.end();
});

//Any invalid URL
app.set('appPath', 'public');
app.use(express.static(__dirname +'../../react-ui/build'));
app.route('/')
  .get(function(req, res) {
    res.sendFile(app.get('appPath') + '/index.js');
  });

app.use('/rest', router);
router.use(xmlparser());
