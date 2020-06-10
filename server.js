const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid/v4');

const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 3001;

// creating an Express app
const app = express();

// morgan middleware allows to log the request in the terminal
app.use(morgan('short'));

// enabling cookies
app.use(cookieParser());

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

// Users database
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

const createNewQuote = (content) => {
  const quoteId = uuid().substr(0, 8);

  // {
  //   id: 'd9424e04',
  //   quote: 'Why so serious?',
  // }

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
  // d9424e04: {
  //   id: 'd9424e04',
  //   quote: 'Why so serious?',
  // }

  // updating the quote key in the quote object
  movieQuotesDb[quoteId].quote = content;

  return true;
};

const addNewUser = (name, email, password) => {
  // Create a user id ... generate a unique id
  const userId = Math.random().toString(36).substring(2, 8);

  // Create a new user object

  const newUser = {
    id: userId,
    name,
    email,
    password,
  };

  // Add the user to the database

  // Read the value associated with the key
  // nameOfTheobject[key]

  // how you add a value to an object
  // nameOfTheobject[key] = value

  users[userId] = newUser;

  return userId;
};

const findUserByEmail = (email) => {

  // using the built-in function here => find
  // return Object.values(users).find(userObj => userObj.email === email);

  // iterate through the users object

  // looping through the keys with a for in
  for (let userId in users) {
    // try the match the email of each
    if (users[userId].email === email) {
      // if it matches return truthy
      return users[userId];
    }
  }

  // if it never returned true, then return false by default
  return false;
};

const authenticateUser = (email, password) => {

  // loop through the users db => object
  const user = findUserByEmail(email);
  // check that values of email and password if they match
  if (user && user.password === password) {
    // return user id if it matches
    return user.id;
  }

  // default return false
  return false;

}

// User Authentication

// Display the register form
app.get('/register', (req, res) => {
  const templateVars = { user: null };
  res.render('register', templateVars);
});

// Handling the register form submit
app.post('/register', (req, res) => {
  // Extract the email and password from the form
  // req.body (body-parser) => get the info from our form

  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  // es6 syntax
  // const {name, email, password} = req.body;

  // validation: check that the user is not already in the database
  const user = findUserByEmail(email);

  // if user is undefined, we can add the user in the db

  if (!user) {
    const userId = addNewUser(name, email, password);

    // Setting the cookie in the user's browser
    res.cookie('user_id', userId);

    // redirect to '/quotes/

    res.redirect('/quotes');
  } else {
    res.status(403).send('User is already registered!');
  }
});

app.get('/users', (req, res) => {
  res.json(users);
});

// Display the login form

app.get('/login', (req, res) => {
  const templateVars = { user: null };
  res.render('login', templateVars);
});

// authenticate the user
app.post('/login', (req, res) => {

  // extract the information from the form with req.body
  // email + password
  const email = req.body.email;
  const password = req.body.password;

  // user must exist, check for the password

  // either userId has a value or it is falsy
  const userId = authenticateUser(email, password);

  if (userId) {
    // Set the cookie with the user id 
    res.cookie('user_id', userId);
  // redirect to /quotes
    res.redirect('/quotes')
  } else {
    // user is not authenticated => error message
    res.status(401).send('Wrong credentials');
  }

  

});

app.post('/logout', (req, res) => {

  // clear the cookie
  res.clearCookie('user_id');
  // res.cookie("user_id", null);

  res.redirect('/quotes');
})


// CRUD operations

// List all the quotes
// READ
// GET /quotes

app.get('/quotes', (req, res) => {
  const quoteList = Object.values(movieQuotesDb);

  // read the user id from the cookies

  const userId = req.cookies['user_id'];
  // userId = '2t6cfm'

  // retrieve the user object from users db
  const currentUser = users[userId];

  // currentUser = {
  // "id": "2t6cfm",
  // "name": "Sherry Cola",
  // "email": "sherry.cola@forever.com",
  // "password": "test"
  // }

  const templateVars = { quotesArr: quoteList, user: currentUser };

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

  // read the user id from the cookies
  const userId = req.cookies['user_id'];

  // retrieve the user object from users db
  const currentUser = users[userId];
  const templateVars = { quoteObj: movieQuotesDb[quoteId], user: currentUser };

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
