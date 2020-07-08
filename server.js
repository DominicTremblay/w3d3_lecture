const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const uuid = require('uuid/v4');

const PORT = process.env.PORT || 3001;

// creating an Express app
const app = express();
app.use(cookieParser());

// morgan middleware allows to log the request in the terminal
app.use(morgan('short'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

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

const users = {
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

const findUserByEmail = (email) => {
  // good.philamignon@steak.com'
  // loop through the users in the db
  for (let userId in users) {
    // if email match the email from the user from the db, return the user
    if (users[userId].email === email) {
      // return the full user object
      return users[userId];
    }
  }

  // return false;
  return false;
};

const addNewUser = (name, email, password) => {
  // const users = {
  //   eb849b1f: {
  //     id: 'eb849b1f',
  //     name: 'Kent Cook',
  //     email: 'really.kent.cook@kitchen.com',
  //     password: 'cookinglessons',
  //   }
  // }

  // generate an id
  const userId = Math.random().toString(36).substring(2, 8);
  // create a new user object => value associated with the id
  const newUser = {
    id: userId,
    name: name,
    email: email,
    password: password,
  };
  // add new user object to the users db
  users[userId] = newUser;

  // return userId
  return userId;
};

const authenticateUser = (email, password) => {
  // Does the user with that email exist?
  const user = findUserByEmail(email);

  // check the email and passord match
  if (user && user.password === password) {
    return user.id;
  } else {
    return false;
  }
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

// User Authentication Routes

// Display the register form to the user
app.get('/register', (req, res) => {
  const templateVars = {user: null};
  res.render('register', templateVars);
});

// Catch the submit of the register form
app.post('/register', (req, res) => {
  // Extract the user info from the form
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  // ES6 syntax
  // const {name, email, password} = req.body;

  // Check if the user already exists in the users db
  // if the user is retrived, we got the user object
  // if not we got falsy
  const user = findUserByEmail(email);

  if (!user) {
    // Add the user in the users db
    const userId = addNewUser(name, email, password);
    // set the user id in the cookie
    res.cookie('user_id', userId);
    // redirect to GET /quote
    res.redirect('/quotes');
  } else {
    res.status(401).send('Error: email already exists');
  }
});

// display the login form
app.get('/login', (req, res) => {
  const templateVars = {user: null};

  res.render('login', templateVars);
});

// Login the user
app.post('/login', (req, res) => {

  // Extract the user info from the request body
  const email = req.body.email;
  const password = req.body.password;


  // Authentication the user
  const userId = authenticateUser(email, password);

  if (userId) {
    // set the user id in the cookie
    res.cookie('user_id', userId);
    // res.redirect /quotes
    res.redirect('/quotes');
  } else {
    res.status(401).send('Wrong credentials');
  }


});

app.get('/users', (req, res) => {
  res.json(users);
});

// CRUD operations

// List all the quotes
// READ
// GET /quotes

app.get('/quotes', (req, res) => {
  const quoteList = Object.values(movieQuotesDb);
  const templateVars = {
    quotesArr: quoteList,
    // reading the userId in the cookie (key), retrieving the user in the users db with that key
    user: users[req.cookies['user_id']]
  };

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
