SELECT 
reservations.id,
properties.title,
properties.cost_per_night,
reservations.start_date as start_date,
AVG(rating) as average_rating
FROM properties
JOIN reservations ON properties.id = reservations.property_id
JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE reservations.guest_id = 1
GROUP BY properties.id, reservations.id
ORDER BY start_date
LIMIT 10;