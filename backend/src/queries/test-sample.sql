USE TungTung;

-- Feature 1 account creation (no output for this query)

INSERT INTO Users(name, phone_number, email, password) 
VALUES('William Huang', '647-555-1192', 'william@uwaterloo.ca', 'password123');
-- in actual codebase, password is hashed before insertion

-- EXAMPLE OUTPUT TABLE
-- uid name           profile_picture phone_number email                overall_rating
-- 1   William Huang  NULL            647-555-1192 william@uwaterloo.ca NULL

-- Feature 2 get list of categories
SELECT * FROM TaskCategories;

-- OUTPUT TABLE
-- category_id category_name
-- 0           Gardening
-- 1           Tutoring
-- 2           Plumbing
-- 3           Moving
-- 4           Cleaning

-- Feature 3 filter by categories
SELECT DISTINCT L.*
FROM Listings L
JOIN BelongsTo B ON L.listid = B.listid
JOIN TaskCategories T ON B.category_id = T.category_id
WHERE T.category_name IN ('Gardening') 
GROUP BY L.listid
HAVING COUNT(DISTINCT T.category_name) = 1;

-- Feature 4 taking a listing
INSERT INTO AssignedTo(listid, uid)
SELECT Listings.listid, Users.uid
FROM Users, Listings
JOIN Posts ON Listings.listid = Posts.listid
WHERE Listings.listid = 1 AND Users.uid = 2 AND Users.uid != Posts.uid AND (
  SELECT COUNT(*)
  FROM AssignedTo
  WHERE AssignedTo.listid = Listings.listid
) < Listings.capacity;

-- OUTPUT TABLE
-- listid uid
-- 1      2

-- Feature 5 (old) creating a listing
INSERT INTO Listings
  (listing_name, description, capacity, price, duration, address, longitude, latitude, deadline, status)
VALUES
  ('Window Cleaning', 'I need the best of the best, will pay extra in tips for a good job!', 2, 45.45, 1, '99 Queen St, Toronto, ON', 123.9, 44.2, '2026-07-23', 'open');

-- EXAMPLE OUTPUT TABLE
-- listid  listing_name     description   capacity price duration address     longitude latitude deadline   status
-- 1       Window Cleaning  I need the... 2        45.45 1        99 Queen... 123.9     44.2     2026-07-23 open

-- setup 
UPDATE Listings
SET status = 'completed'
WHERE listid = 1;

-- Feature 5 (new) adding a review
INSERT INTO Reviews(listid, reviewer_uid, reviewee_uid, rating, comment)
VALUES(1, 2, 1, 1, 'HORRIBLE CLEANING SERVICE I HATE YOU');

-- EXAMPLE OUTPUT TABLE
-- review_id listid reviewer_uid reviewee_uid rating comment                               timestamp
-- 1         1      2            1            1      HORRIBLE CLEANING SERVICE I HATE YOU  06-19-2025    


-- Fancy Feature 3 display user's total earnings
SELECT * FROM Users u LEFT OUTER JOIN (
SELECT SUM(price) total_earnings, uid
FROM Users NATURAL JOIN AssignedTo NATURAL JOIN Listings
WHERE status = 'completed'
GROUP BY uid
) earnings ON u.uid = earnings.uid
WHERE u.uid = 1;

-- Fancy Feature 5 best match recommendations
SELECT 
L.*, 
COUNT(DISTINCT II.category_id) AS category_matches,
SQRT(POW(L.latitude - 43.4723, 2) + POW(L.longitude - (-80.5449), 2)) AS distance,
UNIX_TIMESTAMP(L.deadline) - UNIX_TIMESTAMP(NOW()) AS deadline_seconds,
(
    COUNT(DISTINCT II.category_id) * 75
    + (L.price/L.duration) * 10
    - (UNIX_TIMESTAMP(L.deadline) - UNIX_TIMESTAMP(NOW())) / 6000000 + 20
    - SQRT(POW(L.latitude - 43.4723, 2) + POW(L.longitude - (-80.5449), 2)) * 1 + 255
) AS match_score,
CASE L.status 
    WHEN 'open' THEN 1 
    WHEN 'taken' THEN 2 
    WHEN 'completed' THEN 3 
    WHEN 'cancelled' THEN 4 
    ELSE 5 
END AS status_rank
FROM Listings L
LEFT JOIN BelongsTo B ON L.listid = B.listid
LEFT JOIN InterestedIn II 
ON B.category_id = II.category_id AND II.uid = 1
GROUP BY L.listid
ORDER BY status_rank ASC, match_score DESC;



