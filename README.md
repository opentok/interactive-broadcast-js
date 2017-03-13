# chatshow-node
Chatshow on node


### Testing

#### Unit Tests
We are using [jest](https://facebook.github.io/jest/) to test our React components.

To run the test suite you need to execute:
`npm test`, this will run every spec under the `__tests__` folder.

#### End to End Tests
First thing you need to do before running/writing tests for this project is to
set your `NODE_ENV` to `test`. This will cause WebRTC to use fake media devices
and prevents the prompt for allowing access.

Make sure that you have `protractor` installed.
You should install it globally:
`npm install -g protractor`

Then run this command: `webdriver-manager update`, which si required so
protractor can use the browser drivers (e.g. chrome's) to run the tests.

The test framework is [Jasmine](https://github.com/jasmine/jasmine). And you can find examples [here](http://jasmine.github.io/2.0/introduction.html)

##### About the structure

- The protractor config files are under the `tests` folder.
- All end-to-end tests are under the `tests/e2e` folder.
- Utility modules should go to `tests/utils`
- Inside `tests/e2e` there is a file for each of the app roles: `admin`, `fan`, `celebrity` and `host`.
Those files should have tests that only involve their screen.
The interactions between, let's say the fan and the admin, should go into
the `scenarios.js` file under the same folder.

##### Now you are ready to run the existing tests:

If you want run the tests using Chrome you need to run:
`npm run e2e-chrome`
For Firefox you will need `npm run e2e-firefox`.

Note that you need to have the server running before executing those commands.

`admin.js` is a good place to start if you are not familiar with end-to-end tests.


### Continuous Integration
The current setup is for [TravisCI](https://travis-ci.org/)

Whenever we want to enable CI for this project we will need to follow [these steps](https://devcenter.heroku.com/articles/github-integration)
to enable Automatic Deploy when `master` branch is updated.

Note that the current setup handles:
- the compilation of `less` into `css`
- the transformation of `React` components
- the `uglify` process for `js`.

Once the CI is enabled we can add the compiled `css` and `js` files since
the deploy process will take care of generating them.
