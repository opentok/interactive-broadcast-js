# Interactive Broadcasting Solution Web Client Server

This document describes how to create an OpenTok Interactive Broadcast Solution application.

The ibs-js application (this project) is a web server that serves up client pages for web-based
users of the Interactive Broadcast Solution application.

The ibs-js web server must be used in conjunction with the
[interactive-broadcast-api](https://github.com/opentok/interactive-broadcast-api) server.
The ibs-backend server is a web service that manages interactive broadcast events.

Note that there are also Interactive Broadcasting Solution client apps for
[iOS](https://github.com/opentok/ibs-ios) and [Android](https://github.com/opentok/ibs-android).
These mobile apps view the same broadcast events as are viewed by web clients using the ibs-js
server.

## Application overview

The Interactive Broadcasting Solution lets a large audience of users (fans) participate in a live
interactive video discussion with a celebrity. There a three types of participants in the app:

* The *celebrity* is viewed by all clients in the live event.

* The *host* is also viewed by all clients in the live event.

* *Fans* can watch the live event and get in line to talk with the celebrity (and host)
  live. One fan can participate in the live event at a time (along with the celebrity and host).
  Other fans view the host, celebrity, and current live fan.

* The *producer* producer manages events, setting up and scheduling them. During
  the live event, the producer moves "backstage" fans into the live event (one at a time).

### Producer

The producer has access to a number of pages for managing events:

* The [dashboard](#dashboard)
* The [event settings](#event-settings) page
* The [production](#production-page) page

#### Dashboard

The /admin URL is the producer dashboard, which lists any existing events.

Click the *Add New Event* button at the top of the dashboard to add an event. See the next
section, [Event settings](#event-settings).

Click the *Start Event* button to start an event. This moves the event into "pre-show" status.
This opens the [production page](production-page) for the event. If there is a pre-show image for
the event, it is displayed in the fan view until the event starts. You make the event go from
pre-show status to live by clicking the *Go Live* button in the production page.

Select an element from the *Get Embed Code* drop-down list (at the top of the page) to copy the
embed code for the fan, host, or celebrity page to the clipboard. For example, the following is
an example of the fan embed code:

```html
<div id="show"></div>
          <script src="http://your-domain.com/embed.js"></script>
          <script>
            IBSApp.init({
            adminId: 'SU66DnDjN3CZWKoOah8jbVqxTL73',
            container: '#show',
            userType: 'fan',
          });
          </script>
```

You can add this code to the body of a web page you serve to fans. The embed code displays the most
recent event that is live. If there is no live event, the embed will display the next a pre-show
event. If there's no pre-show event, then the embed won't load any event.

Click the *Copy user ID* button to copy the admin ID into the clipboard. Use this ID to
set the admin ID in mobile clients.

For a completed event that has been archived, one of two buttons will be displayed:

* *Download* -- For events that use individual stream archives, click this button to download
  the archive recording.

* *Watch video* -- For events that use composed archives, click this button to view the
  archive recording.

See the next section for more information on archive settings.

#### Event settings

Each event has the following settings:

* *Name* -- The unique name for the event. You can use letters, numbers, and spaces.

* *Date and time* (optional) -- These dates are displayed in the list of events in the producer
  dashboard. The producer must actually start and stop an event by clicking the *Start event*
  button in the dashboard and then clicking the *Go Live* button in the production page.

* *Event image* -- This image is displayed in the fan view while the event is in pre-show status
  (after the producer clicks the *Start event* button but before the producer clicks the *Go Live*
  button).

* *End event image* (optional) -- This image is displayed in the fan URL after the event ends.

* *Fan URL* -- This is the URL of the fan view of the event. The application automatically generates
  this URL for each event. You can enter this URL in an iframe in the page you
  serve to fans. Note that you can also use the fan embed code from the *Get Embed Code* drop-down
  list on the [dashboard](#dashboard).

* *Fan Audio-Only URL* -- This is the URL of the audio-only fan view of the event. Use this
  in serving fan pages where the fan listens to audio only. The application automatically generates
  this URL for each event.

* *Host URL* -- This is the URL of the host view of the event. The application automatically
  generates this URL for each event. Share this URL with the host. 

* *Celebrity URL* -- This is the URL of the celebrity view of the event. The application
  automatically generates this URL for each event. Share this URL with the celebrity.

* *Redirect URL* (optional) -- Enter the redirect URL of the event. Fans pages will redirect to
  this URL after the show ends.

* *RTMP URL* (optional) -- Enter the URL of RTMP server to broadcast the event.
  RTMP broadcast is an OpenTok beta program. Note that the current OpenTok RTMP beta supports
  Facebook Live and You Tube Live (the Server URL followed by stream key or stream name): 

  ```rtmp://destinationHost:destinationPort/applicationName/streamKeyORStreamName``` 

  For example, OpenTok supports a YouTube Live URL such as 
  `rtmp://a.rtmp.youtube.com/live2/47qh-jt4j-5hh1-8dmd`. And OpenTok supports a FaceBook Live URL 
  such as `rtmp://rtmp-api.facebook.com:80/rtmp/10158311198165238?ds=1&s_l=1&a=BTgwUBCnYgSZK664`. 
  See [this documentation](https://tokbox.com/developer/beta/rtmp-broadcast/) for more information. 

* *Archive Event* -- Select this checkbox (the default) to record this event to an OpenTok archive.

* *Archive Individual Streams* -- Select this checkbox (the default) to have the recorded archive
  be an individual stream archive, or deselect this checkbox to have the archive be a composed
  archive. This setting only applies if the *Archive Event* setting is also selected. See the
  OpenTok documentation on [individual stream and composed
  archives](https://tokbox.com/developer/guides/archiving/#individual-stream-and-composed-archives).
  
To use event archiving, you must set the `BUCKET_URL` property of the .env file for the ibs-backend
app. This value defines the base URL for your Amazon S3 storage bucket used for OpenTok archive
uploads. For more information, see the [ibs-backend README](https://github.com/opentok/ibs-backend)
and [Using an Amazon S3 bucket with OpenTok archiving](https://tokbox.com/developer/guides/archiving/using-s3.html).

#### Production page

This is the page the producer uses to direct a live event.

The producer views an event's production page by clicking the *Start Event* or *View Event* button
on the [Dashboard](dashboard).

Click the *Go Live* button to start the event. The celebrity and host videos will start streaming
to all connected fans. And fans can get in line and join the show.

The production page shows video views for the celebrity, host, and the current fan. It also
shows the view of the backstage fan (if there is one).

The right-hand *Active Fans* list shows fans who are in the queue to go backstage. For each fan
in list there is an indication of the fan's connection (and video stream quality), such as "Great,"
along with the following buttons:

* *Send to Backstage* -- Send the fan to the *Backstage fan* position. This fan will join the live
  event when the current live fan leaves or when you click the *Move to fan feed* button under the
  *Backstage fan* preview video.

* *Call* -- Click to have a private audio conversation with the fan. For example, you may ask the
  fan to adjust the lighting or to use headphones.

* *Chat* -- Click to send and receive text messages to and from the fan.

* *Kick* -- Click to remove the fan from the *Active Fans* list.

Under each video view on the production page there are the following controls:

* Volume -- raise or lower the volume level of the participant. 

* Private call -- Click to have a private conversation with the participant (with the producer). 

* Toggle audio -- Mute and unmute the participant's audio.

* Toggle video -- Show and hide the participant's video stream.

* Chat (host and celebrity only) -- Click to send and receive text messages with this participant.

* Remove (backstage and fan only) -- Removes the participant from the event. If you remove the
  current fan, the backstage fan joins the live event (and interacts with the host and celebrity).

Click the *End Show* button to end the event.

Click the *Copy Admin ID* button to copy the admin ID into the clipboard. Use this ID to
set the admin ID in mobile clients.

The *post-production URL* at the top of the page is a link a production view of the page. This
view shows all live participants (the celebrity, the host, and a live fan), but only the fan's audio
is played back. It also displays the celebrity and host videos when the event is live or
in pre-show mode. This lets the producer preview the event while keeping the production page open
(without audio feedback).

### Fan view

This view shows videos of the celebrity, the host, and the current fan.

The fan can click the *Get in Line* button to get in the event queue. (The producer can then add
the fan to the live event.) When the fan is in the event queue, a *Leave Line* button is displayed.

When the event reaches the maximum number of live participants -- 3,000 -- a fan is served an HLS
stream of the event. In this case, the fan cannot join the queue to talk to the celebrity. Note
that the maximum number of participants is configurable. 3,000 is the default value. You can change
it by setting the `INTERACTIVE_STREAM_LIMIT` property in the .env configuration file in the
ibs-backend application.

### Host view

This presents the celebrity, host, and current fan video to the host.

The *Publish Only On/Off* buttons lets the host toggle between viewing and not viewing other
participants' videos.

### Celebrity view

This presents the celebrity, host, and current fan video to the celebrity.

The *Publish Only On/Off* buttons lets the celebrity toggle between viewing and not viewing other
participants' videos.

If the event has reached the maximum number of active fans, a fan connecting to the event
will see the HLS broadcast of the event. This fan will not be able to join the event interactively
by publishing their audio-video stream. Also, Safari users will always receive the HLS broadcast.
(OpenTok is not currently supported in Safari.)

## Requirements

You will need these dependencies installed on your machine:

* [Node.js v5+](https://nodejs.org) -- This version of the app has been tested with Node.js v5.

* [npm](https://www.npmjs.com/get-npm)

You will also need these API subscriptions:

* [OpenTok](https://tokbox.com) -- An OpenTok API key and secret. You can obtain these by signing up
  with [TokBox](https://tokbox.com/account/user/signup).

* [Firebase](https://firebase.google.com) -- A Firebase app and secret. Interactive Broadcasting
  Solution uses Firebase for underlying storage.

## Setup

There are a few settings and dependencies you must set up to get the app working.

### Save your Firebase settings

You must save Firebase configuration settings before using the app:

1. Create a file named firebase.js file in the src/config directory:

2. Edit the file to contain the following:

   ```javascript
   const config = {
     apiKey: 'your firebase API key',
     authDomain: 'your-domain.firebaseapp.com',
     databaseURL: 'https://your-domain.firebaseio.com',
     storageBucket: 'opentok-ib.appspot.com',
     messagingSenderId: 'your Firebase Cloud Messaging sender ID',
   };

   export default config;
   ```

Set the values in each of the key-value pairs to match your Firebase credentials and settings.

### Install dependencies

In the root directory of the project, run `npm install`.

### Run the app in development mode

First, be sure that the ibs-backend app is running, and that it is configured with the same
Firebase credentials and settings as used by the ibs-js server.

Then, in the project directory, you can run `npm start` or `yarn start`.
This runs the app in the development mode.

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.

You will also see any lint errors in the console.

See [Deployment](#deployment) section for information on building the app for production.

### Using HTTPS in development

You may require the dev server to serve pages over HTTPS. One particular case where this could be
useful is when using [the "proxy"
feature](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#proxying-api-requests-in-development)
to proxy requests to an API server when that API server is itself serving HTTPS.

To do this, set the `HTTPS` environment variable to `true`, then start the dev server as usual with 
`npm start`:

#### Windows (cmd.exe)

```cmd
set HTTPS=true&&npm start
```

(Note: the lack of whitespace is intentional.)

#### Linux, macOS (Bash)

```bash
HTTPS=true npm start
```

Note that the server will use a self-signed certificate, so your web browser will display a warning.

## Customizing the UI

All UI elements of the app are defined in React components, found in the src/components directory.

CSS files are found alongside the React components in each component's directory.

## Technical details

This application is a [React](https://facebook.github.io/react/) app that uses
[Redux](http://redux.js.org/) to manage state.

The app uses [Thunk](https://github.com/gaearon/redux-thunk) middleware to assist in
handling Redux actions.

The app was started using the [Create React
App](https://github.com/facebookincubator/create-react-app) project. See the Readme file for that
project for technical details.

This project uses [Flow](https://flow.org/) to add static types in JavaScript.

## Testing the app

Running `npm test` launches the test runner in the interactive watch mode.

## Deployment

This app is based on the create-react-app project, and it uses client-side routing. See [this
section](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#serving-apps-with-client-side-routing)
of the create-react-app readme file.

To deploy this app easily, we recommend using Heroku. Use the [Heroku Buildpack for Create React
App](https://github.com/mars/create-react-app-buildpack). See [this
documentation](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#heroku).

## Serving the same build from different paths

If you are not using the HTML5 `pushState` history API or not using client-side routing at all, it is unnecessary to specify the URL from which your app will be served. Instead, you can put this in your `package.json`:

```js
  "homepage": ".",
```

This will make sure that all the asset paths are relative to `index.html`. You will then be able to move your app from `http://mywebsite.com` to `http://mywebsite.com/relativepath` or even `http://mywebsite.com/relative/path` without having to rebuild it.

## Customization

Most of the UI for the app is defined in the React components, found in the /src/components
directory. For example, the /src/components/Login/Login.js file includes UI text for the
login page:

```javascript
render(): ReactComponent {
  const { resetError, handleSubmit } = this;
  const { error } = this.state;
  const { onForgotPassword } = this.props;
  const { forgotPassword } = this.props.auth;
  return (
    <div className="Login">
      <div className="Login-header" >
        <img src={logo} alt="opentok" />
      </div>
      <LoginForm onSubmit={handleSubmit} onUpdate={resetError} error={error} forgotPassword={forgotPassword} />
      <div className="Login-messages">
        { error && <div className="Login-error">Please check your credentials and try again</div> }
        <button className={classNames('Login-forgot btn transparent', { inactive: forgotPassword })} onClick={R.partial(onForgotPassword, [true])}>
          { forgotPassword ? 'Enter your email to reset your password.' : 'Forgot your password?' }
        </button>
      </div>
    </div>
  );
}
```

CSS files for these components are in the component directories, alongside the .js files.
