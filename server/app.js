// import node modules
const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const Auth = require('./middleware/auth');
const models = require('./models');

// import our own files
const cookieParser = require('./middleware/cookieParser');
const auth = require('./middleware/auth').createSession;

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use(cookieParser);
app.use(auth);

const verifySession = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
};



app.get('/', verifySession,
  (req, res) => res.render('index')
);

app.get('/login', (req, res) => res.render('login'));

app.get('/create', verifySession,
  (req, res) => {
    res.render('index');
  });

app.get('/links', verifySession,
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  models.Users.get({ username }).then((data) => {
    if (data) {
      res.redirect('/signup');
    }
  });

  models.Users.create({ username, password }).then((data) => {
    models.Sessions.update({ hash: req.session.hash }, { userId: data.insertId }).then(() => {});
    res.redirect('/');
  });
});

app.post('/login', (req, response) => {
  const { username, password } = req.body;

  models.Users.get({ username }).then(data => {
    if (!data) {
      response.redirect('/login');
      return;
    }
    const isUser = models.Users.compare(password, data.password, data.salt);
    if (!isUser) {
      response.redirect('/login');
      response.status(400).json({
        status: 'fail',
        message: 'Authentication credentials do not match',
      });
    } else {
      models.Users.get({ username }).then(user => req.session.userId = user.id).then(() => {
        response.redirect('/');
      }).catch(err => response.status(400).json({
        status: 'fail',
        message: err.message
      }));
      // models.Sessions.update({ });
      // models.Sessions.create().then((res) => {
      //   req.session = {};
      //   req.session.sessionId = res['insertId'];
      //   req.session.user = username;
      //   response.cookie('shortly', res['insertId']);
      // });

    }
  });

  // response.redirect('/login');
});

app.get('/logout', (req, res, next) => {
  models.Sessions.delete({ hash: req.session.hash }).then(() => {
    res.cookie('shortlyid', null);
    req.session.userId = null;
    res.redirect('/');
  });
});

// Add a verifySession helper function to all server routes that require login, redirect the user to a login page as needed. Require users to log in to see shortened links and create new ones. Do NOT require the user to login when using a previously shortened link.
//  Give the user a way to log out. What will this need to do to the server session and the cookie saved to the client's browser?


/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
