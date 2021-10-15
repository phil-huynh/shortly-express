const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (req.cookies) {
    // grab the shortly, check it against the db and assign user values as appropriate
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

