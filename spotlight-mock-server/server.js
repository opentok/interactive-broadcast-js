const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const app = express();
app.use(cors());
app.use(bodyParser.json())

app.get('/api/admin/:adminId', (req, res) => {
  console.log(req.params)
  const user = {
    id: '20348',
    name: 'Aaron Rice',
    email: 'aaron@mail.com',
    otAPIKey: '20934809j',
    otSecret: '102398432',
    superAdmin: true,
    httpSupport: false,
  };
  res.send(user)
});

const events = [
  {
    id: '2098r09js',
    adminId: '0928402',
    adminName: 'Aaron Rice',
    archive: false,
    celebrityUrl: 'http://things.com/a09udf',
    composed: false,
    eventName: 'tim show',
    eventImage: null,
    eventEndImage: null,
    showStarted: "2017-02-13 12:34:15",
    showEnded: "2017-02-21 21:04:57",
    status: 'closed'
  },
    {
    id: '20n092u3r',
    adminId: '0928402',
    adminName: 'OJ Simpson',
    archive: true,
    celebrityUrl: 'http://things.com/a09udf',
    composed: false,
    eventName: 'tim show',
    eventImage: null,
    eventEndImage: null,
    showStarted: '2017-02-16 11:44:15',
    showEnded: '2017-02-20 20:04:57',
    status: 'closed',
  },
  {
    id: '220-3riadf',
    adminId: '0928402',
    adminName: 'Later today',
    archive: true,
    celebrityUrl: 'http://things.com/a09udf',
    composed: false,
    eventName: 'tim show',
    eventImage: null,
    eventEndImage: null,
    showStarted: '2017-03-13 20:00:00.000000',
    showEnded: null,
    status: 'notStarted'
  },
];

app.get('/api/events', (req, res) => {
  res.send(events)
});


app.listen(3001, () => 'Listening on 3001');