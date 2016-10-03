var express = require('express');
var app = express();

// if we are just exposing static resources, we don't need to listen to specific GET requests...
/*
app.get('/', function (req, res) {
  res.send('Hello New World!');
});
*/

app.listen(3000, function () {
  console.log('express_middleware_test : app listening on port 3000!');
});

// middleware function
var myLogger = function (req, res, next) {
  console.log('MIDDLEWARE LOG! file requested : ' + req.path);
  next();
};

// entitlement check
var entitlementChecker = function (req, res, next) {
  var entitlementCheckPassed = false;
  // if it fails, no next() call, end it here...

  // check the 'entitlement' from the data file, does it match an entitlement from the Neo service?
  var yourEntitlement = "ubs_ipo_entitlement_123";

  // sync file load...
  var fs = require('fs');
  var config = JSON.parse(fs.readFileSync('./public' + req.path, 'utf8'));
  var requiredEntitlement = config.entitlement;

  console.log('Comparing Entitlements. Yours : ' + yourEntitlement + ' Required : ' + requiredEntitlement);
  if(yourEntitlement == requiredEntitlement) {
    entitlementCheckPassed = true;
  }

  if(!entitlementCheckPassed) {
    res.status(403).send({ error: 'Entitlement Check Failed - Access Forbidden' });
  } else {
    // do nothing, let it through
    next();
  }
}

// geo ip check (location = country)
var locationChecker = function (req, res, next) {
  var locationCheckPassed = false;
  // if it fails, no next() call, end it here...

  // check the 'entitlement' from the data file, does it match an entitlement from the Neo service?
  var yourLocation = "UK";

  // FIXME double load!
  var fs = require('fs');
  var config = JSON.parse(fs.readFileSync('./public' + req.path, 'utf8'));
  var permittedLocations = config.locations;

  console.log('Comparing Locations. Yours : ' + yourLocation + ' Permitted : ' + permittedLocations);
  if(permittedLocations.indexOf(yourLocation) != -1) {
    locationCheckPassed = true;
  }

  if(!locationCheckPassed) {
    res.status(403).send({ error: 'Location Check Failed - Access Forbidden' });
  } else {
    // do nothing, let it through
    next();
  }
}

// load middleware function - order/placement is important!
app.use(myLogger);
app.use(entitlementChecker);
app.use(locationChecker);

// expose the public data area, containing our static JSON resources
app.use(express.static('public'));

// error handling comes last/next - i.e. previous middleware hasn't succesfully processed the request and returned to the client
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send({error: 'Server Error, probable 404!' });
});
