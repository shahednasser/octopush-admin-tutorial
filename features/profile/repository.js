const knex = require('../../db');

async function getUser(id) {
  const [user] = await knex('users')
    .where('id', id)
    .select('email', 'name', 'reminder_at', 'phone_number');
  return user;
}

async function updateUserInfo({ name, username: email, reminder_at, phone_number, id }) {
  await knex('users')
    .where({ id })
    .update({
      name,
      email,
      reminder_at,
      phone_number,
      updated_at: new Date(),
    });
  const user = await getUser(id);
  return user;
}

module.exports = {
  getUser,
  updateUserInfo,
};
