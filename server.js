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

// cookieParser
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
  '67b3a931': {
    id: '67b3a931',
    quote: 'I love the smell of napalm in the morning.',
  },
  a2d1c8f0: {
    id: 'a2d1c8f0',
    quote:
      "Life moves pretty fast. If you don't stop and look around once in a while, you could miss it.",
  },
  f01b6989: {
    id: 'f01b6989',
    quote: 'Here’s Johnny!',
  },
  '8a246b17': {
    id: '8a246b17',
    quote: 'I’m king of the world!',
  },
  '2c42a78d': {
    id: '2c42a78d',
    quote: 'To infinity and beyond!',
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
  '4fe3d19b': {
    id: '4fe3d19b',
    name: 'Oliver Green',
    email: 'oliver.green@gmail.com',
    password: 'broccolilover',
  },
  '56b14d8a': {
    id: '56b14d8a',
    name: 'Bella Pepperoni',
    email: 'bella.pepperoni@pizzahut.com',
    password: 'pizzaislife',
  },
  ce5a937d: {
    id: 'ce5a937d',
    name: 'Charlie Tuna',
    email: 'charlie.tuna@starkist.com',
    password: 'fishlover',
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

const findUserByEmail = (email) => {
  for (let userId in usersDb) {
    if (usersDb[userId].email === email) {
      // user exists
      return usersDb[userId];
    }
  }
  // user does not exist
  return false;
};

app.get('/', (req, res) => {
  res.redirect('/quotes');
});

app.get('/users.json', (req, res) => {
  res.json(usersDb);
});

// Authentication Routes
// - Register
// - Login

// Display the register from
app.get('/register', (req, res) => {
  // Render the Register form
  const templateVars = { user: null };
  res.render('register', templateVars);
});

// Handle the subission of the Register form
app.post('/register', (req, res) => {
  // extract the information from the form: name, email, password => bodyParser => req.body

  // destructuring
  const { name, email, password } = req.body;

  console.log(req.body);

  // validation
  // does that user exists in database

  // loop through userId and check the emails
  const user = findUserByEmail(email);

  // 2 potential values of user
  // a. user object info with that email => truthy value
  // b. false

  if (user) {
    // the user exists
    return res.status(403).send('User already exists');
  }

  // user does not exist

  // Same as
  // const name = user.name;
  // const email = user.email;
  // const password = user.password;

  // add the user to the usersDb
  // objectName[newKey] = value;
  const userId = uuid().substring(0, 8);
  // {
  //     id: 'ce5a937d',
  //     name: 'Charlie Tuna',
  //     email: 'charlie.tuna@starkist.com',
  //     password: 'fishlover',
  //   },

  usersDb[userId] = {
    id: userId,
    name,
    email,
    password,
  };

  // asking the browser to set the cookie
  res.cookie('user_id', userId);

  // redirect to /quotes
  res.redirect('/quotes');
});

app.get('/login', (req, res) => {
  const templateVars = { user: null };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  // extract the info from the form
  const { email, password } = req.body;

  // you must retrieve the user from the db
  // loop throught he users db
  // compare the email and password

  const user = findUserByEmail(email);
  // 2 potential values
  // a. user object
  // b. false

  if (user && user.password === password) {
    // user is authenticated.
    // log the user in => set the cookie
    res.cookie('user_id', user.id);

    // redirect /quotes
    return res.redirect('/quotes');
  }

  // if that user does exist or does not authenticate => send an error message
  // user is not authenticated

  res.status(401).send('Not authorized');
});

app.post('/logout', (req, res) => {
  // clear the cookies
  res.clearCookie('user_id');
  res.redirect('/quotes');
});

// CRUD operations

// List all the quotes
// READ
// GET /quotes

app.get('/quotes', (req, res) => {
  const quoteList = Object.values(movieQuotesDb);

  // retrieve the user that's currently logged in
  const userId = req.cookies['user_id'];

  const user = usersDb[userId];

  const templateVars = { quotesArr: quoteList, user };

  res.render('quotes', templateVars);

  // res.json(movieQuotesDb);
});

// Display the add quote form
// READ
// GET /quotes/new

app.get('/quotes/new', (req, res) => {
  // retrieve the user that's currently logged in
  const userId = req.cookies['user_id'];

  const user = usersDb[userId];

  const templateVars = { user };

  res.render('new_quote', templateVars);
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

  // retrieve the user that's currently logged in
  const userId = req.cookies['user_id'];

  const user = usersDb[userId];
  const templateVars = { quoteObj: movieQuotesDb[quoteId], user };

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
