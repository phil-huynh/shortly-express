const parseCookies = (req, res, next) => {
  // parse into object
  let cookies = {};

  if (req.headers.cookies) {
    let individualCookies = req.headers.split('; ');
    individualCookies.forEach((cookie) => {
      let thisCookiesPieces = cookie.split('=');
      cookies[thisCookiesPieces[0]] = thisCookiesPieces[1];
    });
  }
  req.cookies = cookies;
  next();
};

module.exports = parseCookies;