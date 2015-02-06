1. What was accomplished during the week

 * Querying competitors based on a radius for each user.
 * Determining we only need one location since it doesn't matter where a user runs.
 * Treadmills will be a no-go. Only people running outside will count.
 * Login/Sign up page removed and replaced with login/sign up modal for simplicity and less reloading. 
 * Completed save_home function which takes in a user adress from a form and 
   geocodes into a lat and lng stored as the users main home

2. Challenges and issues team faced during the week

 * CSS can still be the devil's work, but we're making sense of it
 * How to store the data. E.g. Each user has the Profile (Username, Hashed Password, Home address, Email) and Runs (Speed (mph), Distance (miles), Date of run (date and timestamp)) data. Should we also include classifications of users (Casuals, Marathoners)? Etc.
 * Does speed of query matter? Likely not now, but in the future (assuming success) it might!
 * For the save_home function, creating the form necessary for user input 
   is difficult to test as users cannot yet login and the form should only be
   available post-login user settings. 
 
3. Goals for the end project

 * Prettifying the site
 * Different types of runners (from casuals to marathoners)
 
## Comments by Ming
1. "CSS is the devil's work" --then don't go there.  There are more important things to focus on.
2. "Treadmills will be a no-go. Only people running outside will count." --that's what a former student of mine did. See http://stks.freshpatents.com/Cardibo-Inc-nm1.php (he now has two patents).
3. "Does speed of query matter? Likely not now, but in the future (assuming success) it might!" --yes.  See Assignment 3, particularly those who died trying the extra credit.

