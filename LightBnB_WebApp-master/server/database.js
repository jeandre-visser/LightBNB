const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb',
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
  .query(`SELECT * FROM users WHERE email = $1`, [email])
  .then(result => result.rows[0] || null)
  .catch(error => console.log(error));
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
  .query(`SELECT * FROM users WHERE id = $1`, [id])
  .then(result => result.rows[0] || null)
  .catch(error => console.log(error));
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool
  .query(`
  INSERT INTO users (name, email, password) 
  VALUES ($1, $2, $3) 
  RETURNING *`, [user.name, user.email, user.password])
  .then(result => result.rows[0])
  .catch(error => console.log(error));
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const queryString = `
    SELECT reservations.*,
    properties.*, AVG(property_reviews.rating) as average_rating
    FROM properties
    JOIN reservations ON properties.id = reservations.property_id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.end_date < now()::date
      AND reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY start_date
    LIMIT $2;
  ;`

  return pool
    .query(queryString, [guest_id, limit])
    .then(result => result.rows)
    .catch(error => console.log(error))
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
 const getAllProperties = (options, limit = 10) => {
 
  const queryParams = [];

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  let clause;
  // helper function
  const queryClause = arr => arr.length === 1 ? clause = 'WHERE' : clause = 'AND';


  // filter conditions based on city, minimum and maximum cost, and minimum rating
  if (options.city) {

    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {

    queryParams.push(`${options.owner_id}`);
    queryClause(queryParams);
    queryString += `${clause} owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {

    queryParams.push(`${options.minimum_price_per_night}`);
    queryClause(queryParams);
    queryString += `${clause} cost_per_night >= $${queryParams.length} `;
  }

  if (options.maximum_price_per_night) {

    queryParams.push(`${options.maximum_price_per_night}`);
    queryClause(queryParams);
    queryString += `${clause} cost_per_night <= $${queryParams.length} `;
  }
  
  if (options.minimum_rating) {

    queryParams.push(`${options.minimum_rating}`);
    queryClause(queryParams);
    queryString += `${clause} rating >= $${queryParams.length} `;
  }


  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  return pool.query(queryString, queryParams).then((res) => res.rows);
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  
  const queryString = `
  INSERT INTO properties (
    owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code)
  VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
  )
  RETURNING *
  `;

  const queryParams = [
    property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms, property.country, property.street, property.city, property.province, property.post_code
  ];

  return pool.query(queryString, queryParams)
  .then(result => result.rows[0]);
}
exports.addProperty = addProperty;
