const parseCookies = (req, res, next) => {
  // parse into object
  let cookies = {};

  if (req.headers.cookie) {
    let individualCookies = req.headers.cookie.split('; ');
    individualCookies.forEach((cookie) => {
      let thisCookiesPieces = cookie.split('=');
      cookies[thisCookiesPieces[0]] = thisCookiesPieces[1];
    });
    req.cookies = cookies;
  }
  next();
};

module.exports = parseCookies;