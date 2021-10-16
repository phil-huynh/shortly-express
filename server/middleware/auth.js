const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (req.cookies && req.cookies.shortlyid) {
    const hash = req.cookies.shortlyid;
    models.Sessions.get({ hash }).then((sessionInfo) => {
      if (sessionInfo) {
        req.session = sessionInfo;
        res.cookie('shortlyid', sessionInfo.hash);
        if (sessionInfo.userId) {
          models.Users.get({ id: sessionInfo.userId }).then((user) => {
            req.session.username = user.username;
            req.session.userId = user.id;
            // next();
          });
        }
      } else {
        models.Sessions.create().then((data) => {
          const { insertId } = data;
          models.Sessions.get({ id: insertId }).then((data) => {
            req.session = data;
            res.cookie('shortlyid', data.hash);
            next();
          });
        });
      }
      next();
    }).catch(err => console.log(err));
  } else {
    models.Sessions.create().then((data) => {
      const { insertId } = data;
      models.Sessions.get({ id: insertId }).then((data) => {
        req.session = data;
        res.cookie('shortlyid', data.hash);
        next();
      });
    });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

/*

In middleware/auth.js, write a createSession middleware function that accesses the parsed cookies on the request, looks up the user data related to that session, and assigns an object to a session property on the request that contains relevant user information. (Ask yourself: what information about the user would you want to keep in this session object?)
Things to keep in mind:
An incoming request with no cookies should generate a session with a unique hash and store it the sessions database. The middleware function should use this unique hash to set a cookie in the response headers. (Ask yourself: How do I set cookies using Express?).
If an incoming request has a cookie, the middleware should verify that the cookie is valid (i.e., it is a session that is stored in your database).
If an incoming cookie is not valid, what do you think you should do with that session and cookie?
*/