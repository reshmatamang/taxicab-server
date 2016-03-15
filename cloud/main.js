Parse.Cloud.define('pushData', function(request, response) {
  var params = request.params;
  var ownerId = params.ownerId;
  // var tripId = params.tripId;
  // var trip = params.trip;

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

  // var setConfirm = function(tripId) {

  //   var qr = new Parse.Query("Trip");

  //   console.log("tripId: " + tripId);

  //   var pr = qr.get(tripId, {
  //     success: function (obj) {
  //       console.log("success trip");
  //       trip = obj;
  //       trip.set("status", "confirmed");
  //       // promise1.resolve(obj);
  //     },
  //     error: function (obj, error) {
  //       console.log("error trip");
  //       console.log(error);
  //       // promise1.reject(error);
  //     }
  //   });
  // };

  // console.log("tripID before timeout:" + tripId);

  // setTimeout(setConfirm, 30000, tripId);

  response.success('success');
});




/**

Cloud function for user initiating trip.
Parameters:
userId, driverId


TripStatus:

'requested',
'confirmed',
'driver-notfound',
'done'
'error'


Trip States: These are internal

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

  // var ProjectNumner = "956242433297".
  //     key = "AIzaSyDS4GAwSpVgPOQpDiTwNxeSSpMotTP-9WQ";

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

  //get user
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
      
      // if (driver.get('state') == 'active') {
        //ceate new trip object

        var trip = new Parse.Object("Trip");

        trip.save({
          user: user,
          driver: driver,
          state: 'user-initiated-trip-request',
          status: 'requested'
        }, {
          success: function(savedTrip) {
            //trip saved
            res.success(savedTrip);

            var tripId = savedTrip.id||"12345";
            user.set("currentTripId", tripId);
            driver.set("currentTripId", tripId);
            user.save();
            driver.save();
            //push data to driver
            Parse.Cloud.run('pushData', {
              ownerId: driverId,
              customData: {
                userId: userId,
                tripId: tripId,
                driverId: driverId,
                "text": "User requesting for taxi. Can you pick this user?"
              }
            },{
              success: function (result) {
                console.log(result);
              },
              error: function (error) {
                console.log(error);
              }
            });

          }, error: function(error) {
              res.error(error);
          }
          });
      // } else {
      //   res.error("Requested driver not available. Please select another driver");
      // }
      
    } else {
      res.error("Error while initiating the request");
    }
  };

  Parse.Promise.when(promises).then(initiateTrip);

  
});


  /**
Clud Function for Driver Accepting Trip request
  **/


Parse.Cloud.define('driverAcceptTrip', function(req, res) {
  var driverId = req.params.driverId;
  var tripId= req.params.tripId;
  var promises = [];
  var q1 = new Parse.Query(Parse.User);
  var trip, driver;
  var promise1 = q1.get(driverId, {
    success: function (obj) {
      console.log("driver");
      console.log(obj);
      driver = obj;
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

  var q2 = new Parse.Query("Trip");
  var promise2 = q2.get(tripId, {
    success: function (obj) {
      console.log("trip");
      console.log(obj);
      trip = obj;
      // promise2.resolve(obj);
    },
    error: function (obj, error) {
      console.log(error);
      // promise2.reject(error);
    }
  });

  promises.push(promise2);

  var  assignTripDriver = function () {

    if (driver && trip && trip.get('status') != 'confirmed') {
      trip.save({
        'status': 'confirmed',
        'state': 'driver-accepted-trip-request',
        'driver': driver
      }, {
        success: function () {
          res.success("Trip initiated for this driver");
        }, error: function() {
          res.error("Error while Updating the trip");
        }
      });

    } else {
      res.error("Error while finding driver and trip");
    }

  };

  Parse.Promise.when(promises).then(assignTripDriver);

});

  /**

Clud Function for Driver Denying Trip request
  */


  Parse.Cloud.define('driverDenyTrip', function(req, res) {
  var driverId = req.params.driverId;
  var tripId= req.params.tripId;
  var promises = [];
  var q1 = new Parse.Query(Parse.User);
  var trip, driver;
  var promise1 = q1.get(driverId, {
    success: function (obj) {
      console.log("driver");
      console.log(obj);
      driver = obj;
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

  var q2 = new Parse.Query("Trip");
  var promise2 = q2.get(tripId, {
    success: function (obj) {
      console.log("trip");
      console.log(obj);
      trip = obj;
      // promise2.resolve(obj);
    },
    error: function (obj, error) {
      console.log(error);
      // promise2.reject(error);
    }
  });

  promises.push(promise2);

  var  drnyTrip = function () {

    if (driver && trip) {
      trip.add('deniedDriver', driver);
      trip.save({
      }, {
        success: function () {
          res.success("Trip denied by this driver");
        }, error: function() {
          res.error("Error while Updating the trip");
        }
      });

    } else {
      res.error("Error while finding driver and trip");
    }

  };

  Parse.Promise.when(promises).then(drnyTrip);

});


var driverAssignJob = function (trip) {
  var tripState = trip.get('state'),
      userId = trip.get('user').get('objectId'),
      tripId = trip.get('objectId');
      status = trip.get('status'),
      currentDriver = trip.get('driver'),
      nextDrivers = trip.get('nextDrivers');

  if (tripState == 'driver-accepted-trip-request') {
    //driver accepted trip. No need to for further process
    trip.set('status', 'confirmed');
    trip.save();
  } else if(nextDrivers && nextDrivers.length == 0) {
    //no more drivers for the trip
    trip.set('status', 'driver-notfound');
    trip.set('state', 'driver-notfound');
    trip.add('declinedDriver', currentDriver);
    trip.set('driver', '');
    trip.save();

  } else {
    //process trip request for next driver
    trip.add('declinedDriver', currentDriver);
    var nextDriverId = nextDrivers.shift();
    var nextDriver;
    var driverQ = Parse.Query(Parse.User);
    driverQ.get(nextDriverId, {
      success: function(result) {
        nextDriver = result;

        if (nextDriver.get('state') == 'active') {
          //push data to driver
          Parse.Cloud.run('pushData', {
            ownerId: nextDriverId,
            customData: {
              userId: userId,
              tripId: tripId,
              "text": "User requesting for taxi. Can you pick this user?"
            }
          },{
            success: function (result) {
              console.log(result);
            },
            error: function (error) {
              console.log(error);
            }
          });
        } else {
          //driver not available. go to next driver
          driverAssignJob(trip);
        }

        

      }, error: function(error) {
        console.log(error);
        //execute trip for next drivers
        driverAssignJob(trip);
      }
    });
    trip.set('driver', '');
  }
};

Parse.Cloud.define('initiateTrip2', function(req, res) {
  var userId = req.params.userId;
  var drivers= req.params.drivers;
  console.log(drivers);
  var currDriverId = drivers.shift();


  var recurringJob;


});
