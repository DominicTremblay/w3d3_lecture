const express = require('express');
const morgan = require('morgan');
const uuid = require('uuid/v4');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 3000;

// creating an Express app
const app = express();

// morgan middleware allows to log the request in the terminal
app.use(morgan('short'));

// enables cookie parser
app.use(cookieParser());

// parse application/x-www-form-urlencoded
// providing our app with req.body
// req.body => middleware used to extract information from a form
// { email: 'dom@hello.com', password:'12345'}
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

const findUserByEmail = (email) => {
  for (let userId in usersDb) {
    if (email === usersDb[userId].email) {
      return usersDb[userId];
    }
  }
  return false;
};

app.get('/users.json', (req, res) => {
  res.json(usersDb);
});

app.get('/', (req, res) => {
  res.redirect('/quotes');
});

// Authentication Routes
// routes || end points = the same

// Register Routes

// Display the register form
app.get('/register', (req, res) => {
  // display the register form
  const userId = req.cookies['user_id'];
  const user = usersDb[userId];

  const templateVars = { user: user };

  // with a render => filename
  // with a redirect => your provide a url path ex. res.redirect('/quotes')
  res.render('register', templateVars);
});

// register the new user
app.post('/register', (req, res) => {
  // extract the information from the form
  // req.body => body parser
  console.log('body', req.body);

  // const email = req.body.email;
  // const name = req.body.name;
  // const password = req.body.password;

  const { email, name, password } = req.body;

  // validation => does that user already exists in the user db

  const user = findUserByEmail(email);

  if (user) {
    res.status(403).send('Sorry, that user already exists!');
    return;
  }

  // create a new user in the user db => provide a user id

  const userId = Math.random().toString(36).substring(2, 8);
  usersDb[userId] = {
    id: userId,
    name: name,
    email: email,
    password: password,
  };

  // store the user id in the cookies

  res.cookie('user_id', userId);

  // redirect to /quotes
  // ask the browser to perform another get request

  res.redirect('/quotes');
});

// Login Routes

// display the login form (get)
app.get('/login', (req, res) => {
  const templateVars = { user: null };

  res.render('login', templateVars);
});

// handle the login (post)

app.post('/login', (req, res) => {
  // extract the form information (req.body)
  const { email, password } = req.body;

  // validate username and password
  // retrieve the user from the db with their email
  const user = findUserByEmail(email);

  console.log('user:', user);

  // check the passwords
  if (user && user.password === password) {
    // log the user
    // set cookie with user id
    res.cookie('user_id', user.id);
    // redirect to /quotes
    return res.redirect('/quotes');
  }

  // if not good => send error message
  res.status(403).send('Sorry, wrong credentials');
});

// logout route
app.post('/logout', (req, res) => {
  // delete the user_id from the cookies
  res.clearCookie('user_id');

  res.redirect('/quotes');
});

// CRUD operations

// List all the quotes
// READ
// GET /quotes

app.get('/quotes', (req, res) => {
  const quoteList = Object.values(movieQuotesDb);

  // get the info of the user currently logged in
  // extract the userId from the cookie
  const userId = req.cookies['user_id'];
  const user = usersDb[userId];
  // user can have 2 potential values
  // 1. the user info (name, email, password)
  // 2. undefined => if the user is not logged in

  const templateVars = { quotesArr: quoteList, user: user };

  // req.cookies is not built in => install cookie parser
  console.log('Cookies:', req.cookies);

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
