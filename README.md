#Team Boss#


###Project title
* "Running Champ" (sort of "King of the Hill")


###Problem statement (i.e., what is the problem?)
* People don't have friendly/casual competition in their running routes! It's too solitary. How will anyone know who the best runner is in their area, and how will they know how they compare with other local runners?


###How do we solve the problem?
* We will create a web app that allows you to anonymously (or under a name if they want) and casually compete against other local runners who they might not even know.
* Based on the distance and speed of the run, we will score each runner. Runners will be competiting against other runners within different "hills": a 1 mile radius, 2 mile radius, 5 mile radius, 10 mile radius, 15 mile radius, and 25 mile radius. There will also be daily/weekly/monthly leaderboards for runners within a user's "hill"
    * Users automatically compete in all "hills." Smaller "hills" would be less competitive, as there is less runners within a smaller radius.


###Implementations

* Geolocation
* Server-side Data Persistence (with storing user scores, each individual user won't download *all* the user data each time they open the app)
* Client-side Data Persistence (with storing distances, speeds, and potentially actual running routes)
* Send emails, SMSes, or Push notifications (for alerts, "You just topped the record in <x> Hill!", "Someone just beat your top record by <x> points! Go out and reclaim your Hill!")
* Front-end frameworks (Bootstrap or Foundation)

###Data Collection and Use
* The only data our prototype should need is:
    * Distance traveled and speed (can be calculated locally, stored globally)
    * Regions/"closeness" approximation for finding "Hills" and competitors in "King of the Hill" - Definitely want a sense of localness.
    	* Locations of other runners within a radius is not shown to honor the privacy of users.
    	* Radii are preset to avoid users determining other runners location by increasing radius slowly.
    * Use of MapMyRun API (https://www.mapmyapi.com/) for web users who don't want to bring their phones on runs/be recording their GPS location on the fly

###Algorithms and techniques
* Geolocation
* Tracking distance and speeds


###TODO:
* What data is stored: 
    * Profile (Username, Hashed Password, Home address, Email)
    * Runs (Speed (mph), Distance (miles), Date of run (date and timestamp)) 
* Tracking && Scoring Alogrithm: e.g. FLOOR[(Distance + (1.25 * Speed))] - Colin ---- DONE
* Implement Radii - Matush ---- DONE
    * Locate competitors for each respective radius
    * function is_competitor(location1, location2, radius) returns bool if two people are within sent radius- radius is in miles
* Login/Sign Up page && Logout based on local storage - (Fix address stuff) Michael 
* Run page - Colin
    * Set up layout
    * Verify functionality and score sends
* Leaderboards - Matush (Make it look pretty)
    * Getting data to show up - Eric --- DONE
    * Prettifying data
* Users to set their locations - Michael --- DONE
    * Auto send geolocation (if refused, ban them)
    * Move settings tab to different modal
* Login/Sign Up page - Michael <- get it to send data to the server. see: runningchamp.js line 23, and what used to be login_sign_up.html
    * Check if they are logged in and show them the appropriate menu
* User Stats - GET /api?token=<token>&req=get_runs
    * Getting stats to show up
    * Prettifying stats
    * Best Run (ALL TIME) (THIS WEEK)
    * Each run this last week
    * Client side sorting for all runs
* Emails and Spamming the peeps - Eric --- DONE
* NOTE TO EVERYONE WHO WANTS TO DO TESTING: a reliable user account is:
username: testuser1; password: testuser1; (token: ZmM3YWMzZTdmNGY0MzYyNGU5NjMzZTRiZWJiOGUyM2E).

###Concerns/Expansions
* Tracking distance and speeds through a browser application (in real-time, through javascript. Is this possible in the background of phone webapps?)
* Compare stats with "buddies" with a username/login (should be optional - anonymity (between users - we will still have their IPs to track cheaters) is good)
* Age groups? Don't want to segregate our audience too early, but if it gets to the point where people feel like they can't win any radius, then maybe we'll make it an option.
* People running indoors on treadmills and such
* Runners of different levels (casuals, marathoners)

###Mockups
![My Stats](/pictures/mockups/my_stats.png "My Stats")
![Leaderboards](/pictures/mockups/leaderboards.png "Leaderboards")

#Comments by Ming
* What you listed for features are not features. Features are what the users do in your app (e.g., enter fitness profile).  But you did touched upon some of the features in your "How do we solve the problem?" section.
