# W2D4 - User Authentication with Express

## http is stateless

### What do we mean by statelessness?

- The server doesn't remember you
- The server process every request like a new request

### what is a session

- Application session is server-side data which servers store to identify incoming client requests, their previous interaction details, and current context information.

### Benefits of http Statelessness

- Scalability - no session related dependency
- Less complex - less synchroniztion
- Easier to chache
- The server cannot lose track of information

### Disadvantages

- cannot easily keep track context
- context has to provided each time
- Good transactions. not good for conversations.

## Using cookies to remember the user

### How cookies work

We did this diagram to explain how cookies work:

- [Cookies Diagram](https://drive.google.com/file/d/1_9FET5lWOAXk1s5gaSkAO6qjSw0n9aQw/view?usp=sharing)

- a cookie is a small text file that is stored by a browser on the user’s machine

- a collection of key-value pairs that store information
  - shopping-cart, game scores, ads, and logins

`name=Linguini; style=classy;`

- The response header will set the cookie

  Set-Cookie: <em>value</em>[; expires=<em>date</em>][; domain=<em>domain</em>][; path=<em>path</em>][; secure]

- The browser will store the cookie
- The browser will send the cookie in the request headers of subsequent requests
- can be set for a specific domain
- can have an expiration date, if not session cookie

### Using cookie-parser

- We're going to store the user id in the cookies
- We need to install a middleware in Express to process the cookie: cookie-parser
  - setting the cookie: res.cookie('cookieName','cookieValue')
  - reading the cookie: req.cookies.cookieName
