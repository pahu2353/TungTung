INSERT INTO Users(name, phone_number, email) VALUES('William Huang', '647-555-1192', 'william@uwaterloo.ca');

-- OUTPUT TABLE
-- uid name           profile_picture phone_number email                overall_rating
-- 1   William Huang  NULL            647-555-1192 william@uwaterloo.ca NULL

INSERT INTO Listings
  (listing_name, description, capacity, price, duration, address, longitude, latitude, deadline, status)
VALUES
  ('Window Cleaning', 'I need the best of the best, will pay extra in tips for a good job!', 2, 45.45, 1, '99 Queen St, Toronto, ON', 123.9, 44.2, '2026-07-23', 'open');

-- OUTPUT TABLE
-- listid  listing_name     description   capacity price duration address     longitude latitude deadline   status
-- 1       Window Cleaning  I need the... 2        45.45 1        99 Queen... 123.9     44.2     2026-07-23 open

INSERT INTO AssignedTo(listid, uid)
SELECT listid, uid
FROM Users, Listings
JOIN Posts ON Listings.listid = Posts.listid
WHERE Listings.listid = 1 AND uid = 2 AND uid != Posts.uid AND (
  SELECT COUNT(*)
  FROM AssignedTo
  WHERE AssignedTo.listid = Listings.listid
) < Listings.capacity;

-- OUTPUT TABLE
-- listid uid
-- 1      2

UPDATE Listings
SET status = 'completed'
WHERE listid = 1;

INSERT INTO Reviews(listid, reviewer_uid, reviewee_uid, rating, comment)
VALUES(1, 2, 1, 1, 'HORRIBLE CLEANING SERVICE I HATE YOU');

-- OUTPUT TABLE
-- review_id listid reviewer_uid reviewee_uid rating comment                               timestamp
-- 1         1      2            1            1      HORRIBLE CLEANING SERVICE I HATE YOU  06-19-2025    

SELECT * FROM TaskCategories;

-- OUTPUT TABLE
-- category_id category_name
-- 0           Gardening
-- 1           Tutoring
-- 2           Plumbing
-- 3           Moving
-- 4           Cleaning

SELECT DISTINCT L.*
FROM Listings L
JOIN BelongsTo B ON L.listid = B.listid
JOIN TaskCategories T ON B.category_id = T.category_id
WHERE T.category_name IN ('Gardening') 
GROUP BY L.listid
HAVING COUNT(DISTINCT T.category_name) = 1;
