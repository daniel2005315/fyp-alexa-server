// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const express = require('express');
//const config = require('../config');

// [START setup]
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Indicate login from
// 0: Web
// 1: Alexa skill
var access=0;
// 5-4-2018 Pass along the accessToken as well
function extractProfile (profile,accessToken) {
  let imageUrl = '';
  if (profile.photos && profile.photos.length) {
    imageUrl = profile.photos[0].value;
  }
  return {
    id: profile.id,
    displayName: profile.displayName,
    gender: profile.gender,
    // added extraction of email
    email: profile.emails[0].value,
    accessToken: accessToken
  };
}

// Configure the Google strategy for use by Passport.js.
//
// OAuth 2-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Google API on the user's behalf,
// along with the user's profile. The function must invoke `cb` with a user
// object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new GoogleStrategy({
  clientID: '115422974852-ppcqqt3s258bicmqgmk5nocdu4peo83f.apps.googleusercontent.com',
  clientSecret: 'm3cWBP3-uD3EjSf6lleyt96Z',
  // Change callback url to heroku when deployed
  // callbackURL: 'http://localhost:8080/auth/google/callback
  callbackURL: 'https://alexa-server-ck.herokuapp.com/auth/google/callback',
  accessType: 'offline'
}, (accessToken, refreshToken, profile, cb) => {
  // Extract the minimal profile information we need from the profile object
  // provided by Google
  console.log("[passport.use GoogleStrategy] passport authen returned\n");
  console.log(accessToken);
  console.log(refreshToken);
  console.log(profile);
  cb(null, extractProfile(profile,accessToken));
}));

// 5-4-2018 Add accesstoken generation for testing
// TODO may add custom access token for storage in db to indicate user
passport.serializeUser((user, cb) => {
  console.log('[passport.serializeUser] Started');
  console.log(user);
  cb(null, user);
});
passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});
// [END setup]

const router = express.Router();
// TODO try do auth check for all access

// [START middleware]
// Middleware that requires the user to be logged in. If the user is not logged
// in, it will redirect the user to authorize the application and then return
// them to the original URL they requested.
function authRequired (req, res, next) {
  console.log('[oauth2.authRequired] Started');
  if (!req.user) {
    req.session.oauth2return = req.originalUrl;
    return res.redirect('/auth/login');
  }
  next();
}

// Middleware that exposes the user's profile as well as login/logout URLs to
// any templates. These are available as `profile`, `login`, and `logout`.
function addTemplateVariables (req, res, next) {
  res.locals.profile = req.user;
  res.locals.login = `/auth/login?return=${encodeURIComponent(req.originalUrl)}`;
  res.locals.logout = `/auth/logout?return=${encodeURIComponent(req.originalUrl)}`;
  next();
}
// [END middleware]

// Begins the authorization flow. The user will be redirected to Google where
// they can authorize the application to have access to their basic profile
// information. Upon approval the user is redirected to `/auth/google/callback`.
// If the `return` query parameter is specified when sending a user to this URL
// then they will be redirected to that URL when the flow is finished.
// [START authorize]
router.get(
  // Login url
  '/auth/login',

  // Save the url of the user's current page so the app can redirect back to
  // it after authorization
  (req, res, next) => {
    console.log("[auth/login] GET started");
    // TODO Handle the case where request is from Alexa
    if(req.query.redirect_uri){
      console.log("Access from Alexa skill with redirect uri");
      access = 1;
      req.session.alexa_state=req.query.state;
      req.session.alexa_redirect = req.query.redirect_uri;
      console.log("***Save Alexa auth state as: "+req.session.alexa_state);
      console.log ("***Set alexa_redirect to: "+req.session.alexa_redirect);
    }else{
      console.log("NO redirect_uri embeded, should be from web app");
      access = 0;
    }
    if (req.query.return) {
      req.session.oauth2return = req.query.return;
    }
    next();
  },

  // Start OAuth 2 flow using Passport.js
  passport.authenticate('google', { scope: ['email', 'profile'] })
);
// [END authorize]

// [START callback]
router.get(
  // OAuth 2 callback url. Use this url to configure your OAuth client in the
  // Google Developers console
  '/auth/google/callback',

  // Finish OAuth 2 flow using Passport.js
  passport.authenticate('google'),

  // Redirect back to the original page, if any
  (req, res) => {
    console.log("[callback] Started");
    // TODO try log code returned from Google (should be authorization code)
    if(req.query.code)
      console.log("***Got code: "+req.query.code);
    else {
      console.log("No code")
    }

    var redirect = req.session.oauth2return || '/';
    // TODO Construct the redirect link for Alexa
    if(req.session.alexa_redirect){
      redirect=req.session.alexa_redirect;
      // Pass along the state and authorization code
      // May need to add  "?"
      redirect=redirect+"?state="+req.session.alexa_state+"&code="+req.query.code;
    }
    console.log("Logging the redirect path: "+redirect);
    delete req.session.oauth2return;
    res.redirect(redirect);
  }
);
// [END callback]

// TODO Trying, add Token URI for google api
// [START callback]
router.get(
  // OAuth 2 callback url. Use this url to configure your OAuth client in the
  // Google Developers console
  '/auth/google/token',

  // authRequired middleware
  authRequired,

  // Redirect back to the original page, if any
  (req, res) => {
    // TODO Try logging user info
    console.log(req.user);

    res.send(req.user.accessToken);
  }
);
// [END callback]

// Deletes the user's credentials and profile from the session.
// This does not revoke any active tokens.
router.get('/auth/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = {
  extractProfile: extractProfile,
  router: router,
  required: authRequired,
  template: addTemplateVariables
};
