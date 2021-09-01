const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid/v4');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 3000;

// creating an Express app
const app = express();

// morgan middleware allows to log the request in the terminal
app.use(morgan('short'));

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// activate cookie parser
app.use(cookieParser());

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

const quoteComments = {
  '70fcf8bd': {
    id: '70fcf8bd',
    comment: 'So awesome comment!',
    quoteId: 'd9424e04',
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

// return the user obj containing all the info if email is found
// otherwise return false
const findUserByEmail = (email, usersDb) => {
  // return Object.keys(usersDb).find(key => usersDb[key].email === email)

  for (let userId in usersDb) {
    if (usersDb[userId].email === email) {
      return usersDb[userId]; // return the user object
    }
  }

  return false;
};

const authenticateUser = (email, password, usersDb) => {
  // contained the user info if found or false if not
  const userFound = findUserByEmail(email, usersDb);

  if (userFound && userFound.password === password) {
    return userFound;
  }
  return false;
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

// User Authentication End Points

// send back the list of user info
// just for dev purpose

app.get('/users', (req, res) => {
  console.log(usersDb);
  res.json(usersDb);
});

// Register

// Display the register form
app.get('/register', (req, res) => {
  res.render('register');
});

// Handle the register form
app.post('/register', (req, res) => {
  // Extraction the user info from the form
  // console.log("user info:", req.body);

  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  // Object destructuring
  // const { name, email, password } = req.body

  // Validation: check if a user with that email already exists in the usersDb

  const userFound = findUserByEmail(email, usersDb);

  if (userFound) {
    return res.send('that email exists!');
  }

  // for in and try to find an email that match the email from the form
  // if found => error message
  // if not, we're ok. Continue.

  // {
  //     id: 'eb849b1f',
  //     name: 'Kent Cook',
  //     email: 'really.kent.cook@kitchen.com',
  //     password: 'cookinglessons',
  //   }

  // generate a new user id

  const userId = uuid().substr(0, 8);

  // create a new user object
  const newUser = {
    id: userId,
    name,
    email,
    password,
  };

  // Adding user info to usersDb
  usersDb[userId] = newUser;

  // set the cookie => to remember the user (to log the user in)
  // ask the browser to set a cookie
  res.cookie('user_id', userId);

  // redirect to /quotes
  res.redirect('/quotes');
});

// Login

// Display the login form
app.get('/login', (req, res) => {
  res.render('login');
});

// handle the login form
app.post('/login', (req, res) => {
  // Extract the user info from the login form => req.body
  const { email, password } = req.body;

  // retrieve the user info with that email (it must be an existing user)
  // const userFound = findUserByEmail(email, usersDb);

  // get the user object (authenticated) or false if not
  const user = authenticateUser(email, password, usersDb);

  if (user) {
    // log the user in
    res.cookie('user_id', user.id);
    res.redirect('/quotes');
  } else {
    res.send('Sorry, wrong credentials!');
  }
});

// CRUD operations

// List all the quotes
// READ
// GET /quotes

app.get('/quotes', (req, res) => {
  const quoteList = Object.values(movieQuotesDb);

  // get the user id from the cookies
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
