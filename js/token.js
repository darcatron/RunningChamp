// token is a random hex value 
var xhr = new XMLHttpRequest();
var logged_in = false;

function post_user_info( user ) {
	// posts the token to the server
	if (localStorage.getItem('token')) {
		xhr.open("POST", "http://server", true);
		xhr.send( localStorage.getItem('token') );
		xhr.onreadystatechange = function()
		if (xhr.readyState == 4 && xhr.status == 200)
		{
			user = JSON.parse(xhr.responseText);
			get_user_info(user);
		}
	} else {
		logged_in = false;
	}
}

function get_user_info(data) {
	// request from server
	localStorage.setItem('username') = data['username'];
	localStorage.setItem('home_coords') = data['home_coords']; 
}

function store_local( token ) {
	localStorage.setItem('token') = token;
	logged_in = true;
}