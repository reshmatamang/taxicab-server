Parse.Cloud.define('pushData', function(request, response) {
  var params = request.params;
  var ownerId = request.ownerId;

  // To be used with:
  // https://github.com/codepath/ParsePushNotificationExample
  // See https://github.com/codepath/ParsePushNotificationExample/blob/master/app/src/main/java/com/test/MyCustomReceiver.java
  var customData = params.customData;
  var launch = params.launch;
  var broadcast = params.broadcast;

  console.log("OwnerId: " + ownerId);

  // use to custom tweak whatever payload you wish to send
  var pushQuery = new Parse.Query(Parse.Installation);
  // pushQuery.equalTo("deviceType", "android");
  pushQuery.equalTo("ownerId", ownerId);

  var payload = {};

  if (customData) {
      payload.customdata = customData;
  }
  else if (launch) {
      payload.launch = launch;
  }
  else if (broadcast) {
      payload.broadcast = broadcast;
  }

  // Note that useMasterKey is necessary for Push notifications to succeed.
  Parse.Push.send({
    where: pushQuery,      // for sending to a specific channel
    data: payload,
    }, { 
      success: function() {
       console.log("#### PUSH OK");
      }, 
      error: function(error) {
       console.log("#### PUSH ERROR" + error.message);
     }, 
     useMasterKey: true
   });

  response.success('success');
});




/**
Trip States:
'user-initiated-trip-request'
'user-canceled-trip-request'
'trip-request-sent-to-driver'
'driver-accepted-trip-request'
'driver-denied-trip-request'
'driver-on-wayto-pickup-customer'
'driver-reached-user'
'driver-pickedup-user'
'driver-on-wayto-destination'
'driver-reached-destination'
'driver-canceled-trip-request'
**/


Parse.Cloud.define('initiateTrip', function(req, res) {
  var userId = req.params.userId;
  var driverId = req.params.driverId;
  var promises = [];

  var ProjectNumner = "956242433297".
      key = "AIzaSyDS4GAwSpVgPOQpDiTwNxeSSpMotTP-9WQ";

  var tripStates = {
    0 : 'user-initiated-trip-request',
    1 : 'user-canceled-trip-request',
    2 : 'trip-request-sent-to-driver',
    3 : 'driver-accepted-trip-request',
    4 : 'driver-denied-trip-request',
    5 : 'driver-on-wayto-pickup-customer',
    6 : 'driver-reached-user',
    7 : 'driver-pickedup-user',
    8 : 'driver-on-wayto-destination',
    9 : 'driver-reached-destination',
    10: 'driver-canceled-trip-request'
  };
  var q1 = new Parse.Query(Parse.User);
  var user, driver;
  var promise1 = q1.get(userId, {
    success: function (obj) {
      console.log("user");
      console.log(obj);
      user = obj;
      // promise1.resolve(obj);
    },
    error: function (obj, error) {
      console.log("error user");
      console.log(error);
      // promise1.reject(error);
    }
  });
  // promise1.then(function(val){console.log("value"); console.log(val);});

  promises.push(promise1);

  var q2 = new Parse.Query(Parse.User);
  var promise2 = q2.get(driverId, {
    success: function (obj) {
      console.log("drive");
      console.log(obj);
      driver = obj;
      // promise2.resolve(obj);
    },
    error: function (obj, error) {
      console.log(error);
      // promise2.reject(error);
    }
  });

  promises.push(promise2);


  var initiateTrip = function () {
    //validate if driver and user not null
      console.log(user);
      console.log(driver);
    if (user && driver) {
      
      if (driver.get('state') == 'active') {
        //ceate new trip object

        var trip = new Parse.Object("Trip");
        trip.add("user", user); 
        trip.add("driver", driver);
        trip.add("state", tripStates[0]);

        trip.save().then(function (savedTrip) {
          //trip saved
          user.add("currentTripId", savedTrip.get("objectId"));
          driver.add("currentTripId", savedTrip.get("objectId"));
          user.save();
          driver.save();
          res.success(savedTrip);
          Parse.Cloud.run('pushData', {
            'ownerId': driver.get('objectId')
          });

        }, function (error) {
          res.error(error);
        });
      } else {
        res.error("Requested driver not available. Please select another driver");
      }
      
    } else {
      res.error("Error while initiating the request");
    }
  };

  Parse.Promise.when(promises).then(initiateTrip);

  
});
