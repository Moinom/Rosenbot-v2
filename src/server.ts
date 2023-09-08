import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import { verifySignature } from './twitch';
import EventEmitter from 'events';

dotenv.config();
export const eventEmitter = new EventEmitter();
const PORT = process.env.PORT || '3000';
export const app = express();

app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Receive events from twitch
app.post('/message', (req, res) => {
  const messageSignature = req.header('Twitch-Eventsub-Message-Signature') || '';
  const messageId = req.header('Twitch-Eventsub-Message-Id') || '';
  const messageTimestamp = req.header('Twitch-Eventsub-Message-Timestamp') || '';
  const messageType = req.header('Twitch-Eventsub-Message-Type') || '';

  // Reject requests with invalid signatures
  if (!verifySignature(messageSignature, messageId, messageTimestamp, req.rawBody)) {
    res.status(403).send('Forbidden');
    return;
  }

  // Returning a 200 status with the received challenge to complete webhook creation flow
  if (messageType === 'webhook_callback_verification') {
    console.log('challenge sent', req.body.challenge)
    res.send(req.body.challenge);
    return;
  }

  // Send discord notification
  if (messageType === 'notification') {
    eventEmitter.emit('stream_start', req.body.event);
    console.log('event sent', req.body.event)
    res.send('');
  }
});

// Listen for Twitch events
app.listen(PORT, () => {
  console.log(`Rosenbot listening at http://localhost:${PORT}`);
});
