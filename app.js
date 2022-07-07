'use strict';

const express = require('express');
const line = require('@line/bot-sdk');
const cronJob = require('cron').CronJob;
const { v4: uuid } = require('uuid');

const loader = require('./src/json-loader.js');
const { msgPrefix } = require('./src/constant.js');

// Read config from the json file 
const config = loader.loadConfig();
// Setup Line message channel
const client = new line.Client(config);
// Setup web server
const app = express();
const timezoneOffsetInHours = new Date().getTimezoneOffset() / 60;
// 跨服王: Every Day 10:00, 22:00
// 原野王: Every Day 10:55, 16:55, 22:55
// 大亂鬥: Every Tuesday, Saturday 20:00
// 龍岩谷: Every Wednesday, Sunday 20:00
// 王國副本 + 副本書提醒: Every Tuesday 22:15, Every Saturday 20:30
const messages = [
  {
    cron: `0 0 ${2-timezoneOffsetInHours} * * *`,
    text: "準備跨服王",
  },
  {
    cron: `0 0 ${14-timezoneOffsetInHours} * * 0,1,3,4,5,6`,
    text: "準備跨服王 + 例行活動",
  },
  {
    cron: `0 0 ${12-timezoneOffsetInHours} * * 2,6`,
    text: "大亂鬥活動開始",
  },
  {
    cron: `0 0 ${12-timezoneOffsetInHours} * * 0,4`,
    text: "龍岩谷活動開始",
  },
  {
    cron: `0 10 ${14-timezoneOffsetInHours} * * 2`,
    text: "準備王國防衛戰 & 王國副本1-5階",
  },
  {
    cron: `0 30 ${12-timezoneOffsetInHours} * * 6`,
    text: "準備王國副本6階",
  },
  {
    cron: `0 55 ${2-timezoneOffsetInHours},${8-timezoneOffsetInHours},${14-timezoneOffsetInHours} * * *`,
    text: "準備原野王",
  },
];

const PORT = process.env.PORT || 3000;

messages.forEach(obj => {
  const { cron, text } = obj;
  new cronJob(cron, function () {
    const msg = `${msgPrefix}${text}`;
    const now = new Date() + "";
    
    client.pushMessage(
      'Cae86635b94c45781fd6dee19c7303814',
      { type: 'text', text: msg }
    )
      .then(() => {
        console.log(`${now}: ${msg}`);
      })
      .catch((err) => {
        // error handling
        console.error(err);
      });
  }).start();
});

// Got event from line
const handleEvent = (event) => {
  const { type, message } = event;

  console.log('handleEvent', type, message);
  return Promise.resolve(null);
};

app.get('/', (_, res) => {
  res
    .status(200)
    .send(`Hello, ${uuid()}!`)
    .end();
});
app.post('/linewebhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
