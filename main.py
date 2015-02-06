
import datetime
import webapp2
import logging
import sys
import os
import re
import jinja2 #templating
from google.appengine.ext import ndb
import random
import base64
import math
from google.appengine.api import mail

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname((__file__))),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

class User(ndb.Model):
  username = ndb.StringProperty(default='Anonymous')
  password = ndb.IntegerProperty() # Sent over HTTPS, hashed value is stored (not in plaintext)
  email = ndb.StringProperty()
  token = ndb.StringProperty()

  home_coords = ndb.StringProperty(default='99999 99999') # Lat and Lng (LatLng) separated by one space

  radius_pref = ndb.FloatProperty(default=1.0) # how many miles to search?

  distlist = ndb.FloatProperty(repeated=True) #list of distances the user has ran (in miles)
  speedlist = ndb.FloatProperty(repeated=True) #list of speeds of the user's runs (units?)
  timelist = ndb.DateTimeProperty(repeated=True) # dates the user ran

  score = ndb.FloatProperty(default=0.0)

  @classmethod
  def query_user(self, username):
    return self.query(ancestor=username)


# returns the distance in miles
def distance_apart (p1_lat, p1_lng, p2_lat, p2_lng):
    R = 3959 #miles
    dLat = math.radians(p2_lat - p1_lat)
    dLong = math.radians(p2_lng - p1_lng)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(math.rad(p1_lat)) * math.cos(rad(p2_lat)) *
        math.sin(dLong / 2) * math.sin(dLong / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    d = R * c

    return d

def haversine(lat1, lon1, lat2, lon2):
    # convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
    # haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    miles = 3959 * c
    return miles

# dist and speed are floats, returns a bool
def realistic_speed(dist, speed):
    max_speed = 30 - 2 * dist if dist <= 7.5 else 15
    return 0 <= speed <= max_speed

#dist and speed are floats, returns a float
def get_score(dist, speed):
    return dist + 1.25 * speed


#def are_competing (r1_lat, r1_lng, r2_lat, r2_lng, radius):
#user1 and user2 are User objects
def are_competing(user1, user2, radius):
    r1_lat = get_lat(user1.home_coords)
    r1_lng = get_lng(user1.home_coords)
    r2_lat = get_lat(user2.home_coords)
    r2_lng = get_lng(user2.home_coords)
    #if either user hasn't set up their coords
    if r1_lat == 99999 or r1_lng == 99999 or r2_lat == 99999 or r2_lng == 99999:
        return True #for debugging
        return False
    return haversine(r1_lat, r1_lng, r2_lat, r2_lng) <= radius


def get_lat(home_coords):
    s = ''
    home_coords = str(home_coords)
    for c in home_coords:
        if c != ' ':
            s += c
        else:
            break
    try:
        return float(s.strip())
    except ValueError:
        return 99999

def get_lng(home_coords):
    s = ''
    home_coords = str(home_coords)
    found_whitespace = False
    for c in home_coords:
        if found_whitespace:
            if c != ' ':
                s += c
        elif c == ' ':
            found_whitespace = True
    try:
        return float(s.strip())
    except ValueError:
        return 99999


def db_key(username):
  return ndb.Key('Username', username)

class CreateAccount(webapp2.RequestHandler):
    def post(self):
        logging.warn('trying to create account');
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        self.response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept'
        # Parse request
        username = self.request.get('username', '')
        email = self.request.get('email', '')
        password = self.request.get('password', '')

        # Input validation
        if len(password) < 6 or \
           len(username) < 6 or \
           re.match(r'[a-zA-Z0-9_]+$', username, re.I) == None or \
           not re.match(r'[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}', email, re.I): #if it's not an email address
            logging.info('Invalid request -- bad username/password/email combination')
            self.response.out.write('Invalid request -- bad username/password/email combination')
            return

        # Receiving input
        password = password.__hash__()
        home_coords = self.request.get('home_coords', '99999 99999') #sentinel value
        lat = self.request.get('lat', None)
        lng = self.request.get('lng', None)
        if len(home_coords.split(' ')) != 2 and (not lat or not lng):
            logging.warn('Invalid request -- home coordinates are ' + home_coords)
            self.response.out.write('Invalid request -- home coordinates are ' + home_coords)
            return
        if lat and lng:
            home_coords = lat + ' ' + lng

        # Create user object
        user = User.query_user(db_key(username=username)).fetch(1)
        # Generate token
        token = base64.standard_b64encode(str(hex(random.getrandbits(128)))[2:-1]).replace('+', '-').replace('/', '_')[:-1]
        # assert(token is unique)
        while User.query(User.token == token).fetch(1) != []:
            logging.warn('OH GOD got a hash collision this will never happen')
            token = base64.standard_b64encode(str(hex(random.getrandbits(128)))[2:-1]).replace('+', '-').replace('/', '_')[:-1]

        if user == []:
            user = User(parent=db_key(username=username))
            user.email = email
            user.username = username
            user.password = password
            user.token = token
            user.home_coords = home_coords
            logging.info('SENDING MAIL TO: ' + email.upper())
            #mail.send_mail(sender="The Running Champ Team <popcorncolonel@gmail.com>",
            mail.send_mail(sender="popcorncolonel@gmail.com",
                           to=email,
                           subject="Thank you for joining Running Champ!",
                           body=
"""Thanks for signing up for Running champ!
You can get started here: https://running-champ.appspot.com

Happy running!
The Running Champ Team
""")

            user.put()

            self.response.out.write(user.token) #give them the token
            return
        else:
            logging.warn(username + ' already exists, and was trying to be created!')
            self.response.out.write('Invalid request -- ' + username + ' already exists!')


class API(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        self.response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept'
        req_type = self.request.get('req', None)
        token = self.request.get('token', None)
        username = self.request.get('username', None)
        user = None
        if username != None:
            user = User.query(User.username == username).fetch(1)
        if req_type and req_type == 'get_runs' and user == None and token == None:
            logging.warn('Invalid request -- bad username: ' + str(username))
            self.response.out.write('[]')
            return
        if not user:
            user = User.query(User.token == token).fetch(1)
        if user != None and user == []:
            logging.warn('bad token, but not None (no users found): ' + str(token))
            self.response.out.write('{"err":"bad token, but not None (no users found with token ' + str(token)+' or username '+str(username)+'"}')
            return
        else:
            user = user[0]
            if req_type == 'get_runs':
                body = '['
                distlist = list(user.distlist)
                speedlist = list(user.speedlist)
                timelist = list(user.timelist)
                num_runs = len(distlist)
                for i in range(num_runs):
                    body += '{"date":"' + str(timelist[i]) + '",'
                    body += '"dist":"' + str(distlist[i]) + '",'
                    body += '"speed":"' + str(speedlist[i]) + '"'
                    body += '}'
                    if i != num_runs-1:
                        body += ','
                body += ']'
                self.response.out.write(body)
                return
            if req_type == 'leaderboard':
                count = self.request.get('count', None)
                try:
                    count = int(count) if count != None else 5
                except ValueError:
                    logging.warn('Invalid query -- count is not an integer ('+count+')')
                    self.response.out.write('Invalid query -- count is not an integer ('+count+')')
                    return
                user_radius = user.radius_pref
                try:
                    #competitors = User.query().fetch(count)
                    competitors = User.query().fetch() #hm. if we have like 100k users this prob wont work. or it will take, like, a bad amount of time
                    competitors = [competitor for competitor in competitors if are_competing(competitor, user, user_radius)]
                    competitors = competitors[:count]
                    logging.debug(competitors) # todo: remove? just browse through these and see if any queries are bad
                    '''
                    competitors = User.query(are_competing(User, user, user_radius)).fetch(count)
                        get_lat(str(User.home_coords)), #this type of query is v. jank and i'm not sure if it will work 100%.
                        get_lng(str(User.home_coords)),
                        get_lat(str(user.home_coords)),
                        get_lng(str(user.home_coords)),
                        user_radius)
                    ).fetch(count)
                    '''
                except ValueError: # this will happen if... well... it shouldn't happen
                    self.response.out.write('[]')
                    return
                competitors = sorted(competitors, key=lambda competitor: -1 * competitor.score) #highest points at the top
                if competitors == []:
                    self.response.out.write('No one else!')
                body = '['
                for i in range(count):
                    try: #is this hacky or what. #json
                        next_line = ''
                        next_line += '{'
                        next_line += '"rank":"' + str(i+1) + '",'
                        next_line += '"username":"'+competitors[i].username+'",'
                        next_line += '"score":"'+str(competitors[i].score)+'",'
                        next_line += '"dist":"'+str(haversine(
                            get_lat(competitors[i].home_coords),
                            get_lng(competitors[i].home_coords),
                            get_lat(user.home_coords),
                            get_lng(user.home_coords)))+'"'
                        next_line += '}'
                        body += next_line
                        if i != count-1:
                            body += ','
                    except (ValueError, IndexError): #if fewer than n competitors (where n is the range)
                        body = body[:-1] #remove the comma
                        break
                body += ']'
#TEMP - for demo
                body = '''
[
{
    "username":"mingofthehill",
    "score":"188.01",
    "dist":"0.3153"
},
{
    "username":"colin_hamilton",
    "score":"171.22",
    "dist":"0.2192"
},
{
    "username":"testuser1",
    "score":"138.14",
    "dist":"0.4894289"
},
{
    "username":"popcorncolonel",
    "score":"98.41",
    "dist":"0.1290"
}
]
'''
                self.response.out.write(body) #woooo i made it


class Login(webapp2.RequestHandler):
    def post(self):
        username = self.request.get('username', '')
        password = self.request.get('password', '')
        if len(password) < 6 or len(username) < 6:
            self.response.out.write('Invalid request (too short of a username)')
            return
        password = password.__hash__()
        user = User.query_user(db_key(username=username)).fetch(1)
        if user == []:
            self.response.out.write('Invalid request - user not found')
            return
        user = user[0]
        if user.password == password: #if the two hashes are the same
            self.response.out.write(user.token)
            return
        self.response.out.write('Invalid request - username-passwordd pair not found')


class LogScore(webapp2.RequestHandler):
    def post(self):
        token = self.request.get('token', None)
        dist = self.request.get('dist', None)
        speed = self.request.get('speed', None)
        if token == None or (dist == None and speed == None):
            self.response.out.write('Invalid request')
            return

        try:
            dist = float(dist)
        except ValueError:
            logging.warn('Invalid dist :( ('+str(dist)+')')
            self.response.out.write('Invalid dist :( ('+str(dist)+')')
            return
        try:
            speed = float(speed)
        except ValueError:
            logging.warn('Invalid speed :( ('+str(speed)+')')
            self.response.out.write('Invalid speed :( ('+str(speed)+')')
            return

        if not realistic_speed(dist, speed):
            self.response.out.write('Invalid speed (unrealistic) :( ('+str(speed)+')')
            return

        user = User.query(User.token == token).fetch(1)
        if user == []:
            self.response.out.write('Invalid token :(')
            return
        else:
            user = user[0]
            try:
                user.distlist.append(dist)
                user.speedlist.append(speed)
                user.score += get_score(dist, speed)
                user.timelist.append(datetime.datetime.now())
                user.put()
                self.response.out.write('Success - ' + str(dist) +' '+ str(speed) +' '+ str(user.score))
                return
            except ValueError:
                self.response.out.write('Invalid request - bad data')
                return


class MainHandler(webapp2.RequestHandler):
    def get(self):
        template_values = {
        }
        template = JINJA_ENVIRONMENT.get_template('index.html')
        self.response.write(template.render(template_values))

app = webapp2.WSGIApplication([
    ('/createaccount', CreateAccount),
    ('/api', API),
    ('/login', Login),
    ('/logscore', LogScore),
    ('/', MainHandler)
], debug=True)

