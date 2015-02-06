/*---------------------------------------------------------------------------*\
 *   map.js                                                                  *
 *   Contains code for loading Google Maps; tracking the user and updating   *
 *   the map accordingly; tracking distance, time, and speed; displaying     *
 *   this to the user; and submitting the information to the server.         *
\*---------------------------------------------------------------------------*/
var map;                   // Will have the google map
var min_accuracy = 250;    // In meters
var min_distance = 50/5280;// In miles
var positions = [];        // Will have the history of the user's location
var run_began = false;     // To know whether to start storing user's location
var timerID = null;        // To hold the ID for the timer for clearInterval
var final_distance = null; // All to be calculated when the user finishes
var final_time = null;
var final_speed = null;


/*  For starting up google maps; should do that asap.
 *  Assigns to the global map variable
 */
function initializeGMap() {
    var mapOptions = {
        center: { lat: 42.4069, lng: -71.1198},  // Arbitrary point near Tufts
        zoom: 10
    };
    map = new google.maps.Map(document.getElementById("google-map"),
        mapOptions);
}


/*  Draws a line between two points onto the global map variable
 */
function drawLineBetween(lat1, lng1, lat2, lng2) {
    var path = new google.maps.Polyline({
        path: [new google.maps.LatLng(lat1, lng1),
               new google.maps.LatLng(lat2, lng2)],
        geodesic: true
    });
    path.setMap(map);
    return path;
}

/*  Returns distance between points on a globe, in miles, based
 *  on their latitudes and longitudes.
 */
function distBtwn(lat1, lng1, lat2, lng2) {
    var toRad = function(num) {
        return num * Math.PI / 180;
    }
    var earthRadius = 3959;
    var x1 = lat2-lat1;
    var dLat = toRad(x1);
    var x2 = lng2-lng1;
    var dLon = toRad(x2);
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return earthRadius * c;
}



/*  Compares newPos to previous locations, returning true if the speed is a
 *    realistic running speed, otherwise false.
 *  Bases the comparison on the past three positions; by checking several
 *    positions, geolocation inaccuraccies should be averaged out and not
 *    create any false alarms.
 *  Bases a realistic speed on the max_speed global.
 */
function realisticIntermediateSpeed(newPos) {
    if (positions.length < 3) return true;
    return realisticSpeed(positions[positions.length - 3], newPos);
}

/*  Compares two positions, returning true if the speed it took to go from one
 *    to the other is realistic.
 */
function realisticSpeed(oldPos, newPos) {
    var dist = Math.abs(newPos.distance - oldPos.distance);
    var time = Math.abs(newPos.time - oldPos.time);
    var max_speed = (dist < 7.5) ? 30 - 2 * dist : 15;
    time /= 1000;  // ms to s
    var speed = dist * 3600 / time;
    if (speed <= max_speed) return true;
    return false;
}

/*  Called whenever position changes.
 *  If the run hasn't started, just keeps their "initial" position up-to-date
 *  If it has started, pushes it onto their list of positions, keeping track
 *    of the path.  Associated with each position is the distance the user
 *    has traveled to that point; the time at which it was recorded; and
 *    a marker, to which the map pans.
 *  TODO:  Verify that the speed is realistic for a runner.
 */
function add_position(pos) {
    if (pos.coords.accuracy >= min_accuracy) return;
    var lat = pos.coords.latitude;
    var lng = pos.coords.longitude;
    var distance = 0;
    var line = null;
    if (positions.length > 0) {
        var prev = positions[positions.length - 1];
        distance = Math.abs(distBtwn(lat, lng, prev.lat, prev.lng));
        if (distance < min_distance) return;
        distance += prev.distance;
        if (run_began) line = drawLineBetween(prev.lat, prev.lng, lat, lng);
    } else {
        $("#start-button").css("display", "block");
    }
    var latlng = new google.maps.LatLng(lat, lng);
    var this_pos = {
            "distance": distance,
            "lat": lat,
            "lng": lng,
            "time": new Date(),
            "accuracy": pos.coords.accuracy,
            "line": line,
            "marker":  new google.maps.Marker({
                    "position": latlng,
                    "map": map
            })
        };
    if (!realisticIntermediateSpeed(this_pos)) {
        alert("Slow down, Usain.");
        return;
    }
    if (!run_began && positions.length > 0) {
        positions[0].marker.setMap(null);
        positions[0] = this_pos;
    } else {
        positions.push(this_pos);
    }
    map.panTo(latlng);
    map.setZoom(16);
    writeRunInfo();
}

/*  Writes distance traveled and average speed onto the page, based on the
 *  values in the global positions array.
 */
function writeRunInfo() {
    var dist;
    var time;
    if (positions.length > 0) {
        dist = positions[positions.length - 1].distance;
        time = positions[positions.length - 1].time - positions[0].time;
        time /= 1000;   // ms to s
    } else {
        dist = 0;
        time = 0;
    }
    if (time == 0) {  // Avoid division by zero in speed calculation
        dist = 0;
        time = 1;
    }
    $("#run-distance").html("Distance: " + dist.toFixed(3) + " mi");
    $("#run-speed").html("Avg speed: " + (dist * 3600 / time).toFixed(3)
                        + " mph");
}

/*  For debugging
 */
function print_positions() {
    /*
    console.log("-------------");
    for (key in positions) {
        console.log(positions[key]);
    }
    */
}

/*  Given a number of seconds, returns time in HH:MM:SS format, which,
 *  depending on the number of seconds, may look like any of the following:
 *         0:SS
 *         M:SS
 *        MM:SS
 *      H:MM:SS
 *  H...H:MM:SS
 *  (For negative times, places a minus sign in front)
 */
function secondsToTime(sec) {
    var r_val = "";
    sec = Number(sec);
    if (sec < 0) {
        r_val += "-";
        sec = -sec;
    }
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = Math.floor((sec % 3600) % 60);
    if (h > 0) {
        r_val += h + ":";
    }
    if (h > 0 && m < 10) r_val += "0";
    r_val += m + ":";
    if (s < 10) r_val += "0";
    r_val += s;
    return r_val;
}

/*  A class that keeps track of time.
 *  Call incrementTime() once per second.
 */
function Timer() {
    this.time_elapsed = 0;
    this.initial_time = new Date();
    this.getTime = function() {
        return this.time_elapsed;
    }
    this.incrementTime = function() {
        this.time_elapsed++;
        if (this.time_elapsed % 15 == 0) {  // Re-synchronize every 15s
            this.time_elapsed = (new Date() - this.initial_time) / 1000;
            this.time_elapsed = Math.round(this.time_elapsed);
        }
        return this.time_elapsed;
    }
}

/*  Clears all markers from the positions global array, starting at
 *  index "start"
 */
function clearMarkers(start, end) {
//    if (!start) start = 0;
    for (var i = start; i < end; ++i) {
        if (positions[i].marker) {
            positions[i].marker.setMap(null);
        }
        if (positions[i].line) {
            positions[i].line.setMap(null);
        }
    }
}

/*  Called when the user starts their run.  Should only be called if an
 *    initial position has been found.
 *  Places the current timestamp on the user's initial position;
 *    sets the run_began global to true; sets a timer to continually
 *    update the user on time elapsed.
 *  TODO: Lets a user start a new run by clearing the previous run's stats.
 */
function start_run() {
    run_began = true;
    $("#stop-button").css("display", "block");
    $("#submit-button").css("display", "none");
    $("#start-button").text("Restart run");
    $("#run-time").html("Time: " + secondsToTime(0));
    /*  If we've already found their position, take the most-recently-found
     *  position, and place the current timestamp on it.
     *  If we haven't, not much to do but keep waiting for it.
     */
    if (positions.length > 0) {
        if (positions.length > 1) {
            positions[0].marker.setMap(null);
            positions[0] = positions[positions.length - 1];
            positions.length--;
            clearMarkers(1, positions.length - 1);
            positions.length = 1;
        }
        positions[0].distance = 0;
        positions[0].time = new Date();
    } else {
        alert("Give us a minute to find your position....");
    }
    var timer = new Timer();
    if (timerID) clearInterval(timerID);
    timerID = setInterval(function() {
        $("#run-time").html("Time: " + secondsToTime(timer.incrementTime()));
    }, 1000);
    writeRunInfo();
}

/*  Called when the user signals that their run is over.
 *  Sets run_began to false, calculates distance, time, and average speed,
 *    and tells the user these values.
 */
function stop_run() {
    run_began = false;
    $("#stop-button").css("display", "none");
    clearInterval(timerID);
    if (positions.length > 1) {
        final_distance = positions[positions.length - 1].distance;
        final_time = positions[positions.length - 1].time
                   - positions[0].time;
        final_time /= 1000;   // ms to s
        if (realisticSpeed(positions[0], positions[positions.length - 1])) {
            $("#submit-button").css("display", "block");
        } else {
            alert("No way you ran that fast");
        }
    } else {
        alert("You didn't run anywhere, champ");
    }
    print_positions();
}


function submit() {
    var score;
    if (positions.length > 1) {
        var speed = final_distance / final_time;
        speed *= 3600;  // mi/s to mi/h
        score = Math.floor(final_distance + (1.25 * speed));
        $.post('https://running-champ.appspot.com/logscore',
        {
            dist:final_distance,
            speed:speed,
            token:localStorage['token'],
        }, function(data) {
            // bad input (for example, token was undefined (aka not logged in))
            if (data.indexOf('invalid') > -1 || data.indexOf('Invalid') > -1) {
                alert("Error: " + data); //TODO: remove alerts man
            } else { //all good input!
                window.location.replace("leaderboards.html");
            }
        });
    } else {
        alert("You need to, like, actually move somewhere bro");
    }
}

/*  For geolocation to call in case of error
 */
function geolocationError(err) {
    if (err.code == err.PERMISSION_DENIED) {
        alert("This page is no good if we can't track your run.  "
              + "If you want to use us, refresh the page and allow us to "
              + "use geolocation.");
    }
    if (err.code == err.POSITION_UNAVAILABLE && !run_began) {
        /* Empty the array.  This is to prevent a trick whereby a user:
         *   - Opens the page at some location, initial position gets found
         *   - Turns off internet/geolocation
         *   - Moves to a location very far away
         *   - Starts run
         *   - Turns internet/geolocation back on
         */
        clearMarkers(0);
        positions.length = 0;
        $("#start-button").css("display", "none");
    }
    /*  Do nothing on other errors, since watchPosition will just keep trying.
     */
}


$(document).ready(function() {
    if (!localStorage['token']) {
        window.location.replace("index.html?login");
    }
    if (google && google.maps) {
        google.maps.event.addDomListener(window, 'load', initializeGMap);
    } else {
        alert("Cannot load Google Maps!  Please check your connection.")
    }

    if(!navigator.geolocation) {
        alert("Geolocation not enabled!  Please check your browser or "
              + "device settings.")
    }
    /*  Note that just because we're watching the user's position, doesn't
     *  mean we're storing it.  add_position() will wait until the start_run()
     *  function has been called, but this allows us to get their position
     *  more quickly when the run starts.
     */
    geoOptions = {
        enableHighAccuracy : true,
        timeout: 30000,
        maximumage: 60000
    };
    navigator.geolocation.watchPosition(add_position,
                                        geolocationError,
                                        geoOptions);
    writeRunInfo();
    $("#run-time").html("Time: " + secondsToTime(0));
});
