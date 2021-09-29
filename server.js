const express = require('express');
const morgan = require('morgan');
const uuid = require('uuid/v4');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 3000;

// creating an Express app
const app = express();

// morgan middleware allows to log the request in the terminal
app.use(morgan('short'));

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// Static assets (images, css files) are being served from the public folder
app.use(express.static('public'));

// Setting ejs as the template engine
app.set('view engine', 'ejs');

// activate cookieParser
app.use(cookieParser());

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

// AUTHENTICATION HELPER FUNCTIONS

const findUserByEmail = function (email, users) {
  for (let userId in users) {
    const user = users[userId];
    if (email === user.email) {
      return user;
    }
  }

  return false;
};

const createUser = function (name, email, password, users) {
  const userId = uuid().substring(0, 6);

  // adding to an object
  // objectname[key] = value
  // Create a new user
  users[userId] = {
    id: userId,
    name,
    email,
    password,
  };

  return userId;
};

const authenticateUser = function (email, password, usersDb) {
  // retrieve the user from the db
  const userFound = findUserByEmail(email, usersDb);

  // compare the passwords
  // password match => log in
  // password dont' match => error message
  if (userFound && userFound.password === password) {
    return userFound;
  }

  return false;
};

app.get('/', (req, res) => {
  res.redirect('/quotes');
});

// AUTHENTICATION ROUTES (login + register)

app.get('/register', (req, res) => {
  const templateVars = { user: null };

  // display the register form
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  // we need to extract the info from the body of request => req.body
  console.log('req.body:', req.body);
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  // const {name, email, password} = req.body; // destructuring

  // check if that user already exist in the usersDb
  // if yes, send back error message
  // if no, we're good

  // userFound can be a user object OR
  // false
  const userFound = findUserByEmail(email, usersDb);

  console.log('userFound:', userFound);

  if (userFound) {
    res.status(401).send('Sorry, that user already exists!');
    return;
  }

  // userFound is false => ok register the user

  const userId = createUser(name, email, password, usersDb);

  // Log the user => ask the browser to set a cookie with the user id
  res.cookie('user_id', userId);

  // redirect to '/quotes'

  res.redirect('/quotes');
});

app.get('/login', (req, res) => {
  // if we here, we take for granted that the user is not logged in.
  const templateVars = { user: null };

  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  // extract the email and password from the body of request => req.body

  const email = req.body.email;
  const password = req.body.password;


  // compare the passwords
  // password match => log in
  // password dont' match => error message

  const user = authenticateUser(email, password, usersDb);

  if (user) {
    // user is authenticated
    // setting the cookie
    res.cookie('user_id', user.id);

    // redirect to /quotes
    res.redirect('/quotes'); //=> hey browser, can you do another request => get /quotes
    return;
  }

  // user is not authenticated => send error

  res.status(401).send('Wrong credentials!');
});

// CRUD operations

// List all the quotes
// READ
// GET /quotes

app.get('/quotes', (req, res) => {
  const quoteList = Object.values(movieQuotesDb);

  // retrieve the user info => email? => cookies to rerieve the user id
  const userId = req.cookies['user_id'];

  console.log({ userId });

  // retrieving the user object from usersDb
  const loggedInUser = usersDb[userId];

  const templateVars = { quotesArr: quoteList, user: loggedInUser };

  res.render('quotes', templateVars);

  // res.json(movieQuotesDb);
});



// Display the add quote form
// READ
// GET /quotes/new

app.get('/quotes/new', (req, res) => {
  // retrieve the user info => email? => cookies to rerieve the user id
  const userId = req.cookies['user_id'];

  // retrieving the user object from usersDb
  const loggedInUser = usersDb[userId];

  const templateVars = { user: loggedInUser };

  res.render('new_quote', templateVars);
});

// Display the form
// GET /quotes/:id
app.get('/quotes/:id', (req, res) => {
  const quoteId = req.params.id;
  // retrieve the user info => email? => cookies to rerieve the user id
  const userId = req.cookies['user_id'];
  // retrieving the user object from usersDb
  const loggedInUser = usersDb[userId];

  const templateVars = { quoteObj: movieQuotesDb[quoteId], user: loggedInUser };

  // render the show page
  res.render('quote_show', templateVars);
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
