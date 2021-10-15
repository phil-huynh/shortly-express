const parseCookies = (req, res, next) => {
  // parse into object
  req.cookies = req.headers.cookie;
  next();
};

module.exports = parseCookies;