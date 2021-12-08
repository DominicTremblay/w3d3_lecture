const express = require('express');
const morgan = require('morgan');
const uuid = require('uuid/v4');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 3000;

// creating an Express app
const app = express();

// morgan middleware allows to log the request in the terminal
app.use(morgan('short'));

// activate cookie parser => req.cookies
app.use(cookieParser());

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// Static assets (images, css files) are being served from the public folder
app.use(express.static('public'));

// Setting ejs as the template engine
app.set('view engine', 'ejs');

// In memory database
const movieQuotesDb = {
  d9424e04: {
    id: 'd9424e04',
    quote: 'Why so serious?',
  },
  '27b03e95': {
    id: '27b03e95',
    quote: 'YOU SHALL NOT PASS!',
  },
  '5b2cdbcb': {
    id: '5b2cdbcb',
    quote: "It's called a hustle, sweetheart.",
  },
  '917d445c': {
    id: '917d445c',
    quote: 'The greatest teacher, failure is.',
  },
  '4ad11feb': {
    id: '4ad11feb',
    quote: 'Speak Friend and Enter',
  },
};

const usersDb = {
  eb849b1f: {
    id: 'eb849b1f',
    name: 'Kent Cook',
    email: 'really.kent.cook@kitchen.com',
    password: 'cookinglessons',
  },
  '1dc937ec': {
    id: '1dc937ec',
    name: 'Phil A. Mignon',
    email: 'good.philamignon@steak.com',
    password: 'meatlover',
  },
};

const createNewQuote = (content) => {
  const quoteId = uuid().substr(0, 8);

  // creating the new quote object
  const newQuote = {
    id: quoteId,
    quote: content,
  };

  // Add the newQuote object to movieQuotesDb

  movieQuotesDb[quoteId] = newQuote;

  return quoteId;
};

const updateQuote = (quoteId, content) => {
  // updating the quote key in the quote object
  movieQuotesDb[quoteId].quote = content;

  return true;
};

const findUserByEmail = (email, db) => {
  for (let userId in db) {
    const user = db[userId]; // => retrieve the value

    if (user.email === email) {
      return user;
    }
  }

  return false;
};

const authenticateUser = (email, password, db) => {

  console.log({email,password})

  const user = findUserByEmail(email, db);

  console.log({user});

  if (user && user.password === password) {
    return user;
  }

  return false;
};

app.get('/', (req, res) => {
  res.redirect('/quotes');
});

// AUTHENTICATION ROUTES

app.get('/register', (req, res) => {
  // render the register form

  const templateVars = { user: null };

  res.render('register', templateVars);
});

// temporaray route to show the users
app.get('/users.json', (req, res) => {
  res.json(usersDb);
});

// receive the info from the register form
app.post('/register', (req, res) => {
  // extract the user info from the incoming form => req.body
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  // validation ? => we need to ensure that the new user is not already in the database
  // retrieve if a user with that email exists in the db
  // if yes => send back an error message
  // if no => continue with the register

  const user = findUserByEmail(email, usersDb);

  if (user) {
    res.status(403).send('Sorry, user already exists!');
    return;
  }

  // create a new user id
  const userId = Math.random().toString(36).substr(2, 8);

  // add name, email, password to our users db => create a new user

  const newUser = {
    id: userId,
    name,
    email,
    password,
  };

  // add the new user to the db
  usersDb[userId] = newUser;

  // set the cookie => keep the userId in the cookie
  // ask the browser to keep that information
  res.cookie('user_id', userId);

  // redirect to '/quotes'
  res.redirect('/quotes');
});

app.get('/login', (req, res) => {
  const templateVars = { user: null };

  res.render('login', templateVars);
});

// authenticate the user
app.post('/login', (req, res) => {
  // extract the form info => req.body
  const email = req.body.email;
  const password = req.body.password;

  const user = authenticateUser(email, password, usersDb);

  console.log({user});

  if (user) {
    // user is authenticated => log the user

    // asking the browser to store the user id in the cookies
    res.cookie('user_id', user.id);
    res.redirect('/quotes');
    return;
  }
  // user is not authenticated
  res.status(401).send('wrong credentials!');
});

app.post('/logout', (req, res) => {
  // remove the cookie
  res.clearCookie('user_id');

  // redirect
  res.redirect('/quotes');
});

// CRUD operations

// List all the quotes
// READ
// GET /quotes

app.get('/quotes', (req, res) => {
  const quoteList = Object.values(movieQuotesDb);

  // get userId from the cookies
  // how do we read the cookies?

  const userId = req.cookies['user_id'];

  const templateVars = { quotesArr: quoteList, user: usersDb[userId] };

  res.render('quotes', templateVars);

  // res.json(movieQuotesDb);
});

// Display the add quote form
// READ
// GET /quotes/new

app.get('/quotes/new', (req, res) => {
  res.render('new_quote');
});

// Add a new quote
// CREATE
// POST /quotes

app.post('/quotes', (req, res) => {
  // extract the quote content from the form.
  // content of the form is contained in an object call req.body
  // req.body is given by the bodyParser middleware
  const quoteStr = req.body.quoteContent;

  // Add a new quote in movieQuotesDb

  createNewQuote(quoteStr);

  // redirect to '/quotes'
  res.redirect('/quotes');
});

// Edit a quote

// Display the form
// GET /quotes/:id
app.get('/quotes/:id', (req, res) => {
  const quoteId = req.params.id;
  const templateVars = { quoteObj: movieQuotesDb[quoteId] };

  // render the show page
  res.render('quote_show', templateVars);
});

// Update the quote in the movieQuotesDb
// PUT /quotes/:id

app.post('/quotes/:id', (req, res) => {
  // Extract the  id from the url
  const quoteId = req.params.id;

  // Extract the content from the form
  const quoteStr = req.body.quoteContent;

  // Update the quote in movieQuotesDb

  updateQuote(quoteId, quoteStr);

  // redirect to '/quotes'
  res.redirect('/quotes');
});

// DELETE

app.post('/quotes/:id/delete', (req, res) => {
  const quoteId = req.params.id;

  delete movieQuotesDb[quoteId];

  res.redirect('/quotes');
});

// Delete the quote

app.listen(PORT, () => console.log(`Server is running at port ${PORT}`));
