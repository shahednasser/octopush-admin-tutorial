/* eslint-disable no-console */
const axios = require('axios').default;
const moment = require('moment');
const { updateUserInfo, getUser } = require('../repository');
const { UPDATE_INFO_SUCCESS_MESSAGE, UPDATE_INFO_ERROR_MESSAGE } = require('../constants');

async function updateUser(req, res) {
  let { user } = req;
  const profileSuccessMessage = UPDATE_INFO_SUCCESS_MESSAGE;
  let previousReminderAt = null;
  let previousPhoneNumber = null;

  const apiKey = process.env.OCTOPUSH_APIKEY;
  const apiLogin = process.env.OCTOPUSH_APILOGIN;

  if (!apiKey || !apiLogin) {
    req.session.messages = {
      errors: { databaseError: 'Please add your API Keys to send Octopush reminders.' },
    };
    res.redirect('/profile');
  }
  try {
    const userInfo = await getUser(user && user.id);
    previousPhoneNumber = userInfo.phone_number;
    previousReminderAt = userInfo.reminder_at;
    user = await updateUserInfo({ ...req.body, id: user.id });
  } catch (error) {
    user = error;
  }

  if (!user.email) {
    console.error(user);
    const databaseError = UPDATE_INFO_ERROR_MESSAGE;
    req.session.messages = { errors: { databaseError } };
    res.redirect('/profile');
    return;
  }

  if (
    user.reminder_at &&
    user.phone_number &&
    (user.reminder_at !== previousReminderAt || user.phone_number !== previousPhoneNumber)
  ) {
    const reminderDate = moment(user.reminder_at, 'HH:mm');
    const requestData = {
      text: 'Remember to login to Argon.',
      recipients: [
        {
          phone_number: user.phone_number,
        },
      ],
      type: process.env.OCTOPUSH_TYPE ? process.env.OCTOPUSH_TYPE : 'sms_low_cost',
      sender: process.env.OCTOPUSH_SENDER ? process.env.OCTOPUSH_SENDER : 'Octopush',
      send_at: reminderDate.toISOString(),
      purpose: 'alert',
      with_replies: false,
    };

    axios
      .post('https://api.octopush.com/v1/public/sms-campaign/send', requestData, {
        headers: {
          'api-key': apiKey,
          'api-login': apiLogin,
        },
      })
      .then(({ data }) => {
        if (data.sms_ticket) {
          // sms schedules
          req.session.messages = {
            success: 'A message has been scheduled to remind you to login tomorrow',
          };
          req.session.userInfo = { ...user };
        } else {
          req.session.messages = {
            errors: { databaseError: 'An error occurred when scheduling your messages' },
          };
        }
        res.redirect('/profile');
      })
      .catch(err => {
        if (err.response) {
          console.error(err.response);
        } else if (err.request) {
          console.error(err.request);
        } else {
          console.error(err.message);
        }
        req.session.messages = {
          errors: { databaseError: 'An error occurred when scheduling your messages' },
        };
        res.redirect('/profile');
      });
  } else {
    req.session.messages = { success: profileSuccessMessage };
    req.session.userInfo = { ...user };
    res.redirect('/profile');
  }
}

module.exports = updateUser;
