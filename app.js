(function LINEBOT() {
  const express = require('express');
  const line = require('@line/bot-sdk');
  const mysql = require('mysql');
  const { CronJob } = require('cron');
  const { v4: uuid } = require('uuid');

  const { msgPrefix } = require('./src/constant');
  const loader = require('./src/json-loader');

  /**
   * Variables
   */
  const config = loader.loadConfig(); // Read config from the json files
  const client = new line.Client(config.lineChannel); // Setup Line message channel

  /**
   * Methods
   */
  const queryMysql = (sql) => {
    const connection = mysql.createConnection(config.mysql);

    return new Promise(async (resolve, reject) => {
      const connErr = await connection.connect();

      if (connErr) {
        reject(connErr);
      } else {
        connection.query(sql, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
          connection.end();
        });
      }
    });
  };

  /**
   *  [
   *    { cron: "0 0 10 * * *", text: "line test messgae" },
   *    ...
   *  ]
   */
  const fetchCronJobs = async () => {
    const timezoneOffsetInHours = new Date().getTimezoneOffset() / 60;
    const sql = 'SELECT * FROM ninokuni.push_jobs WHERE enabled = 1';
    const result = await queryMysql(sql);

    return result.map((job) => {
      const { cron, message: text } = job;
      const pattern = cron.split(' ');
      const hourString = pattern[2];
      const hours = hourString.split(',');

      pattern[2] = hours.map((h) => parseInt(h, 10) - timezoneOffsetInHours).join(',');
      return {
        cron: pattern.join(' '),
        text,
      };
    });
  };

  // Got event from line
  const handleEvent = (event) => {
    const { type, message } = event;

    console.log('Line Message Event: ', type, message);
    // Disable replyMessage for now.
    return Promise.resolve(null);
  };

  const createPushJobs = (cronJobs) => {
    cronJobs.forEach((obj) => {
      const { cron, text } = obj;
      new CronJob(cron, (() => {
        const msg = `${msgPrefix}${text}`;
        const now = `${new Date()}`;

        client.pushMessage(
          config.lineGroup.id,
          { type: 'text', text: msg },
        )
          .then(() => {
            console.log(`${now}: ${msg}`);
          })
          .catch((err) => {
            console.error(err);
          });
      })).start();
    });
  };

  const startWebService = () => {
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.get('/', (_, res) => {
      res
        .status(200)
        .send(`Hello, ${uuid()}!`)
        .end();
    });
    app.post('/linewebhook', line.middleware(config.lineChannel), (req, res) => {
      Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result));
    });
    app.listen(PORT, () => {
      console.log(`App listening on port ${PORT}`);
      console.log('Press Ctrl+C to quit.');
    });
  };

  const start = async () => {
    // Fetch regular events from MySQL
    const messages = await fetchCronJobs();

    // Init cron jobs
    createPushJobs(messages);
    // Boot web server
    startWebService();
  };

  start();
}());
