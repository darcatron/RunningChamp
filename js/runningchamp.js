/******************************************************************************
 *      Scroll Effects For when "learn more" button on                        *
 *      main page is clicked or "how it works" is clicked                     *
 *****************************************************************************/
function moreInfo() {
	scrollToID('#learn-more', 750);
};

function scrollToID(id, speed) {
  var offSet = 50;
  var targetOffset = $(id).offset().top - offSet;

  $('html,body').animate({scrollTop:targetOffset}, speed);
};



/******************************************************************************
 *                           On-load Checks                                   *
 *****************************************************************************/
$(document).ready(function() {
  change_menu();

  if (window.location.search == "?login") {
    $('#myModal').modal('show');
  }

  if (localStorage["username"]) {
    $("ul#main-menu a")[0].text = "Welcome, " + localStorage["username"];
  }

  if (window.location.search == "?howitworks") {
      moreInfo();
  }
});

/******************************************************************************
 *                    Log in & Sign up / Log out                              *
 *****************************************************************************/
function change_menu () {
  if (localStorage['token']) {
    if(window.location.href.indexOf("index.html") > 0) {
        $('#main-menu')[0].innerHTML = "<li class='active'><a href='#'>Welcome</a></li> <li><a href='leaderboards.html'>Leaderboards</a></li> <li><a href='#' onclick='moreInfo()'>How it Works</a></li><li><a href='play.html'>RUN</a></li><li><a href='#'' onclick='logout()''>Logout</a></li>";
    }
    else if (window.location.href.indexOf("leaderboards.html") > 0) {
        $('#main-menu')[0].innerHTML = "<li><a href='index.html'>Welcome</a></li> <li class='active'><a href='#'>Leaderboards</a></li> <li><a href='index.html?howitworks'>How it Works</a></li><li><a href='play.html'>RUN</a></li><li><a href='#'' onclick='logout()''>Logout</a></li>";
    } 
    else if (window.location.href.indexOf("play.html") > 0){
        $('#main-menu')[0].innerHTML = "<li><a href='index.html'>Welcome</a></li> <li><a href='leaderboards.html'>Leaderboards</a></li> <li><a href='index.html?howitworks'>How it Works</a></li><li class='active'><a href='#'>RUN</a></li><li><a href='#'' onclick='logout()''>Logout</a></li>";
    }
    else {
        // The user went to the landing page: https://running-champ.appspot.com/
        $('#main-menu')[0].innerHTML = "<li class='active'><a href='#'>Welcome</a></li> <li><a href='leaderboards.html'>Leaderboards</a></li> <li><a href='#' onclick='moreInfo()'>How it Works</a></li><li><a href='play.html'>RUN</a></li><li><a href='#'' onclick='logout()''>Logout</a></li>";
    } 
  }
}

function receive_token(data) {
    if (data.indexOf('invalid') < 0 && data.indexOf('Invalid') < 0) {
        localStorage['token'] = data;
        if ($('#userid').val() && $('#userid').val() != '') {
            localStorage['username'] = $('#userid').val();
        }
        if ($('#userid_login').val() && $('#userid_login').val() != '') {
            localStorage['username'] = $('#userid_login').val();
        }
        location.reload();
    } else {
        alert("Could not sign in: " + data);
    }
}

$('#signin').click(function() {
    $.post('/login',
      {
        username: $('#userid_login').val(),
        password: $('#passwordinput').val(),
      },
      receive_token);
});

$('#confirmsignup').click(function() {

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            myLat = position.coords.latitude;
            myLng = position.coords.longitude;
            $.post('/createaccount',
              {
                username: $('#userid').val(),
                password: $('#password').val(),
                email: $('#Email').val(),
                home_coords: myLat + ' ' + myLng,
              },
              receive_token);
                });
    } else {
        myLat = 42.4069;      // Defaults to Tufts
        myLng = -71.1198;
        $.post('/createaccount',
          {
            username: $('#userid').val(),
            password: $('#password').val(),
            email: $('#Email').val(),
            home_coords: myLat + ' ' + myLng,
          },
          receive_token);
    }
});

function showPassword() {
    var key_attr = $('#key').attr('type');

    if (key_attr != 'text') {
        $('.checkbox').addClass('show');
        $('#key').attr('type', 'text');
    }
    else {
        $('.checkbox').removeClass('show');
        $('#key').attr('type', 'password');
    }
}


if (window.location.search == "?login") {
  $('#myModal').modal('show');
}

if (window.location.search == "?howitworks") {
    moreInfo();
}

function logout () {
    localStorage.removeItem('token');
    localStorage.removeItem("username");
    window.location.href = "index.html";
}

/******************************************************************************
 *              Leaderboards, Scores, and Statistics                          *
 *****************************************************************************/

$('#confirmaddress').click(function() {
    // tentative home address
    // $.post('https://running-champ.appspot.com/settings',
    // {
    //   street_address: $('#address').val(),
    //   city: $('city').val(),
    //   country: "United States",
    //   zipcode: $('zip').val(),
    // });


    address = $('#address').val() + $('city').val() + $('zip').val() + "United States";

    var geocoder = new google.maps.Geocoder;
    geocoder.geocode({ 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
        lat = results[0].geometry.location.lat();
        lng = results[0].geometry.location.lng();
        $.post('https://running-champ.appspot.com/settings',
        {
            // TODO
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!! BROKEN LINE OF CODE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // home_coords: lat + lng;
        }, function() {});
    } else {
      alert('We could not find your address');
    }
  });
});

function create_leaderboard () {
  if (localStorage['token']) {
    //$.get('https://running-champ.appspot.com/api?req=leaderboard&token='+localStorage['token'], function(data) {
    $.get('/api?req=leaderboard&token='+localStorage['token']+'&count=5', function(data) {
        //if bad token or geolocation not set

        if (data.indexOf('invalid') > -1 || data.indexOf('Invalid') > -1) {
            alert(data);
            return;
        }
        try {
            leaders = JSON.parse(data);
        } catch(e) { //if no json, then no one is competing
            alert(e);
            //$('#board')[0].innerHTML = 'No one is competing in your region!';
            return;
        }

        $('#table-competition')[0].innerHTML += "<tbody>"
        leaders.forEach(function(leader) {
            $('#table-competition')[0].innerHTML += '<tr>';
            $('#table-competition')[0].innerHTML += '<td>' + leader.username + '</td>'+'<td>' + leader.score + ' points</td>'+'<td>' + leader.dist + ' miles</td>';
            $('#table-competition')[0].innerHTML += '</tr>';
        });
        $('#table-competition')[0].innerHTML += "</tbody>"
    });
    $.get('/api?req=get_runs&token='+localStorage['token']+'&count=5', function(data) {
        //if bad token or geolocation not set
alert("data " + data);
        if (data.indexOf('invalid') > -1 || data.indexOf('Invalid') > -1) {
            alert(data);
            return;
        }
        try {
            runs = JSON.parse(data);
        } catch(e) { //if no json, then no one is competing
            alert(e);
            //$('#board')[0].innerHTML = 'No one is competing in your region!';
            return;
        }
        /*
        $('#board')[0].innerHTML = '';
        $('#board')[0].innerHTML = "<table id='leaderboard'><tr><th id='rank'> -- Rank - </th><th id='username'> - Username -</th><th id='score'> - Score -</th><th id='dist'> - Distance From You --</th></tr></table>";
        */
        $('my-runs')[0].innerHTML += "<tbody>"
        runs.forEach(function(run) {
            $('#my-runs')[0].innerHTML += '<tr>';
            $('#my-runs')[0].innerHTML += '<td>' + run.date + '</td>'+'<td>' + run.dist + ' miles</td>'+'<td>' + run.speed + ' mph</td>';
            $('#my-runs')[0].innerHTML += '</tr>';
        });
        $('my-runs')[0].innerHTML += "<tbody>"
    });
  }
  else {
    $('#myModal').modal('show');
  }
}
