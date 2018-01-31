/*
 Copyright 2017 IBM Corp.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const WebAppStrategy = require("bluemix-appid").WebAppStrategy;
const userAttributeManager = require("bluemix-appid").UserAttributeManager;
const app = express();
const helmet = require("helmet");
const express_enforces_ssl = require("express-enforces-ssl");
const cfEnv = require("cfenv");

const GUEST_USER_HINT = "A guest user started using the app. App ID created a new anonymous profile, where the user’s selections can be stored.";
const RETURNING_USER_HINT = "An identified user returned to the app with the same identity. The app accesses his identified profile and the previous selections that he made.";
const NEW_USER_HINT = "An identified user logged in for the first time. Now when he logs in with the same credentials from any device or web client, the app will show his same profile and selections.";

const LOGIN_URL = "/ibm/bluemix/appid/login";
const CALLBACK_URL = "/ibm/bluemix/appid/callback";

if (cfEnv.getAppEnv().isLocal) {
   console.error('This sample should not work locally, please push the sample to Bluemix.');
   process.exit(1);
}

// Security configuration
app.use(helmet());
app.use(helmet.noCache());
app.enable("trust proxy");
app.use(express_enforces_ssl());

// Setup express application to use express-session middleware
// Must be configured with proper session storage for production
// environments. See https://github.com/expressjs/session for
// additional documentation
app.use(session({
  secret: "123456",
  resave: true,
  saveUninitialized: true,
	proxy: true,
	cookie: {
		httpOnly: true,
		secure: true
	}
}));

app.set('view engine', 'ejs');

// Use static resources from /samples directory
app.use(express.static("views"));

// Configure express application to use passportjs
app.use(passport.initialize());
app.use(passport.session());

passport.use(new WebAppStrategy());

// Initialize the user attribute Manager
userAttributeManager.init();



// Configure passportjs with user serialization/deserialization. This is required
// for authenticated session persistence accross HTTP requests. See passportjs docs
// for additional information http://passportjs.org/docs
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

// Explicit login endpoint. Will always redirect browser to login widget due to {forceLogin: true}.
// If forceLogin is set to false redirect to login widget will not occur of already authenticated users.
app.get(LOGIN_URL, passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
  forceLogin: true
}));

// Callback to finish the authorization process. Will retrieve access and identity tokens/
// from AppID service and redirect to either (in below order)
// 1. the original URL of the request that triggered authentication, as persisted in HTTP session under WebAppStrategy.ORIGINAL_URL key.
// 2. successRedirect as specified in passport.authenticate(name, {successRedirect: "...."}) invocation
// 3. application root ("/")
app.get(CALLBACK_URL, passport.authenticate(WebAppStrategy.STRATEGY_NAME, {allowAnonymousLogin: true}));


//Generate the main html page
app.get('/',function(req,res){
	res.sendfile(__dirname + '/views/index.html');
});

// Protected area. If current user is not authenticated - redirect to the login widget will be returned.
// In case user is authenticated - a page with current user information will be returned.
app.get("/protected", passport.authenticate(WebAppStrategy.STRATEGY_NAME), function(req, res){
    var accessToken = req.session[WebAppStrategy.AUTH_CONTEXT].accessToken;
    var toggledItem = req.query.foodItem;
    var isGuest = req.user.amr[0] === "appid_anon";


    // get the attributes for the current user:
    userAttributeManager.getAllAttributes(accessToken).then(function (attributes) {
        var foodSelection = attributes.foodSelection ? JSON.parse(attributes.foodSelection) : [];
        var firstLogin = !isGuest && !attributes.points;
        if (toggledItem) {
            var selectedItemIndex = foodSelection.indexOf(toggledItem);
            if (selectedItemIndex >= 0) {
                foodSelection.splice(selectedItemIndex, 1);
            } else {
                foodSelection.push(toggledItem);
            }

            // update the user's selection
            userAttributeManager.setAttribute(accessToken, "foodSelection", JSON.stringify(foodSelection))
                .then(function (attributes) {
                    givePointsAndRenderPage(req, res, foodSelection, isGuest, firstLogin);
                });

        } else {
            givePointsAndRenderPage(req, res, foodSelection, isGuest, firstLogin);
        }
    });


	});

function givePointsAndRenderPage(req, res, foodSelection, isGuest, firstLogin) {
    //return the protected page with user info

    var hintText;
    if (isGuest) {
        hintText = GUEST_USER_HINT;
    } else {
        if (firstLogin) {
            hintText = NEW_USER_HINT;
        } else {
            hintText = RETURNING_USER_HINT;
        }
    }
    var email = req.user.email;
    if(req.user.email !== undefined && req.user.email.indexOf('@') != -1)
           email = req.user.email.substr(0,req.user.email.indexOf('@'));
    var renderOptions = {
        name: req.user.name || email || "Guest",
        picture: req.user.picture || "/images/anonymous.svg",
        foodSelection: JSON.stringify(foodSelection),
        topHintText: isGuest ? "Login to get a gift >" : "You got 150 points go get a pizza",
        topImageVisible : isGuest ? "hidden" : "visible",
        topHintClickAction : isGuest ? ' window.location.href = "/login";' : ";",
        hintText : hintText
    };

    if (firstLogin) {
        userAttributeManager.setAttribute(req.session[WebAppStrategy.AUTH_CONTEXT].accessToken, "points", "150").then(function (attributes) {
            res.render('protected', renderOptions);
         });
    } else {
        res.render('protected', renderOptions);
    }



}

// Protected area. If current user is not authenticated - an anonymous login process will trigger.
// In case user is authenticated - a page with current user information will be returned.
app.get("/anon_login", passport.authenticate(WebAppStrategy.STRATEGY_NAME, {allowAnonymousLogin: true, successRedirect : '/protected', forceLogin: true}));

// Protected area. If current user is not authenticated - redirect to the login widget will be returned.
// In case user is authenticated - a page with current user information will be returned.
app.get("/login", passport.authenticate(WebAppStrategy.STRATEGY_NAME, {successRedirect : '/protected', forceLogin: true}));


app.get("/token", function(req, res){

	//return the token data
	res.render('token',{tokens: JSON.stringify(req.session[WebAppStrategy.AUTH_CONTEXT])});
});

var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("Listening on http://localhost:" + port);
});
