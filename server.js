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

// activates cookieparser
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

// Error message
let error = '';

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

const findUserByEmail = (email) => {
  // loop and try to match the email
  for (let userId in users) {
    const userObj = users[userId];

    if (userObj.email === email) {
      // if found return the user
      return userObj;
    }
  }

  // if not found return false
  return false;
};

const authenticateUser = (email, password) => {

  const userFound = findUserByEmail(email);

  if (userFound && userFound.password === password) {
    // user is authenticated
    return userFound;
  }

  return false;
};

const addNewUser = (name, email, password) => {

    // create a new user in the database
    // {
    //   id: 'eb849b1f',
    //   name: 'Kent Cook',
    //   email: 'really.kent.cook@kitchen.com',
    //   password: 'cookinglessons',
    // }

    // generate a random id
    const id = Math.random().toString(36).substring(2, 8);

    const newUser = {
      id,
      name,
      email,
      password,
    };

    // add the new user to users db
    users[id] = newUser;

    return id; // return the id => add it to cookie later

}

// Routes for managing user session

app.get('/headers', (req, res) => {
  res.json(req.headers);
  console.log('Cookies: ', req.cookies);
});

// display the login form
app.get('/login', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = users[userId];
  const templateVars = { error: error, user };

  res.render('login', templateVars);
});

// catch the login post with email and password
app.post('/login', (req, res) => {
  // extract email and password from the form
  const email = req.body.email;
  const password = req.body.password;

  // authenticate the user (email, password checks out)

  // retrieve the user with that email
  // user can be either the user object or false
  const user = authenticateUser(email, password);

  if (user) {
    res.cookie('user_id', user.id);
    res.redirect('/quotes');
  } else {
    res.status(401).send('Wrong credentials');
  }


});

app.get('/register', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = users[userId];
  const templateVars = {user}
  res.render('register', templateVars);
});

// create a new user in the database and log the user in
app.post('/register', (req, res) => {
  // extract the info from the form with req.body

  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  // shortcut
  // const {name, email, password} = req.body;

  // check if the user does not already exists
  // find the user by email

  // 2 potential values
  // getting the user obj OR
  // false
  const userFound = findUserByEmail(email);

  if (!userFound) {

    const userId = addNewUser(name, email, password);
    // setCookie
    res.cookie('user_id', userId);
    console.log(users);
    // redirect to /quotes
    res.redirect('/quotes');
  } else {
    res.send('The user already exists!');
  }
});

app.post('/logout', (req,res) => {

  // clear the cookies

  res.clearCookie('user_id');

  res.redirect('/quotes');
})

// CRUD operations

// List all the quotes
// READ
// GET /quotes

app.get('/quotes', (req, res) => {
  const quoteList = Object.values(movieQuotesDb);
  
  const userId = req.cookies['user_id'];
  const user = users[userId];
  const templateVars = { quotesArr: quoteList, user };


  // check if the user is loggedin
  if (userId) {
    res.render('quotes', templateVars);
  } else {
    // the user_id is not set
    // cannot see the quotes
    res.status(401).send('You need to login to access the quotes!');
    // error = "You need to login to access the quotes!";
    // res.redirect('/login');
  }
});

// Display the add quote form
// READ
// GET /quotes/new

app.get('/quotes/new', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = users[userId];
  const templateVars = {user}
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
  const userId = req.cookies['user_id'];
  const user = users[userId];
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
