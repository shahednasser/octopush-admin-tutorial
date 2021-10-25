const Joi = require('joi');

const constants = require('../constants');

const { NAME_MIN, NAME_MAX } = constants;

const schema = Joi.object().keys({
  name: Joi.string()
    .min(NAME_MIN)
    .max(NAME_MAX)
    .required(),
  username: Joi.string().email({ minDomainAtoms: 2 }),
  reminder_at: Joi.string().regex(new RegExp(/^[0-2][0-9]:[0-5][0-9]$/)),
  phone_number: Joi.string().regex(new RegExp(/^\+[0-9]{8,}/)),
});

async function validateRegisterPayload(req, res, next) {
  let payloadValidation;
  try {
    payloadValidation = await Joi.validate(req.body, schema, { abortEarly: false });
  } catch (validateRegisterError) {
    payloadValidation = validateRegisterError;
  }
  const { details } = payloadValidation;
  let errors;
  if (details) {
    errors = {};
    details.forEach(errorDetail => {
      const {
        message,
        path: [key],
        type,
      } = errorDetail;
      const errorType = type.split('.')[1];
      errors[key] = constants[`${key.toUpperCase()}_${errorType.toUpperCase()}_ERROR`] || message;
    });
  }

  if (errors) {
    req.session.messages = { errors };
    return res.status(400).redirect('/profile');
  }
  return next();
}

module.exports = validateRegisterPayload;
