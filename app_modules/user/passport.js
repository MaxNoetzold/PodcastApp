/*
  - defines the passport rules for
      login
      register
  - we use the passport-local strategy
  - we use sessions (incl. Cookies)
*/

let bcrypt = require('bcrypt');
let timeLogging = require('../logging/timeLogging.js');

const BCRYPT_SALT_ROUNDS = 12;

let passport = require('passport');
let localStrategy = require('passport-local').Strategy;
let getUser = require('./user.js').getUser;
let setUserPassword = require('./user.js').setUserPassword;

function initPassport() {
  /*
    login rule
     - checks that user exists and has a password defined (= is registered)
     - uses bcrypt to compare the given password with the saved (hashed+salted) password
  */
  passport.use(
		'login',
		new localStrategy(
			{
				usernameField: 'username',
				passwordField: 'password',
				session: true,
			},
			(username, password, done) => {
				try {
					getUser(username).then(function(user) {
            // check that exists and registered
						if (!user || user === null) {
							return done(null, false, { message: 'User not found!' });
            }
            if (!user.password) {
							return done(null, false, { message: 'Not registered yet!' });
						}

            // check if password is correct
						bcrypt.compare(password, user.password).then(response => {
							if (response !== true) {
								return done(null, false, { message: 'Wrong password!' });
							}
							// user found & authenticated
							return done(null, user);
						});
					});
				} catch (err) {
					done(err);
				}
			},
		),
	);

  /*
    register rule
     - checks that user exists (I only allow users to create accounts that are predefined)
     - checks if user has already a password defined (= is already registered)
     - TODO/Future: New users get a password which they have to change on first login
     - uses bcrypt to hash password and safe it with user.js setUser function to register the user
  */
  passport.use(
    'register',
    new localStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
        session: true,
      },
      (username, password, done) => {
        try {
          getUser(username).then(function(user) {
            // checks that user exists but not yet registered
            if (!user || user == null) {
              return done(null, false, { message: 'Username is not predefined!' });
            }
            if (user.password) {
              return done(null, false, { message: 'User already registered!' }); //bc password is already defined
            }

            // register user by hashing his password with a salt
            bcrypt.hash(password, BCRYPT_SALT_ROUNDS).then(hashedPassword => {
              setUserPassword(username, hashedPassword).then(function(newUser) {
                if(!newUser) {
                  return done(null, false, { message: 'Error at register please try again or contact Max :D' });
                }
                timeLogging('user ' +  username + ' created');
                return done(null, newUser);
              });
            });
          });
        } catch (err) {
          done(err);
        }
      },
    ),
  );

  // stuff needed for passport; exactly the standard code, nothing special here
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
}

module.exports = initPassport;
