INSERT INTO Accounts(name, phone_number, email) VALUES('William Huang', '647-555-1192', 'william@uwaterloo.ca');

-- OUTPUT TABLE
-- uid name           profile_picture phone_number email                overall_rating
-- 1   William Huang  NULL            647-555-1192 william@uwaterloo.ca NULL

INSERT INTO Listings
  (listing_name, description, poster_uid, capacity, price, duration, address, longitude, latitude, deadline, status)
VALUES
  ('Window Cleaning', 'I need the best of the best, will pay extra in tips for a good job!', 1, 2, 45.45, 1, '99 Queen St, Toronto, ON', 123.9, 44.2, '2026-07-23', 'open');

-- OUTPUT TABLE
-- listid  listing_name     description   poster_uid capacity price duration address     longitude latitude deadline   status
-- 1       Window Cleaning  I need the... 1          2        45.45 1        99 Queen... 123.9     44.2     2026-07-23 open

INSERT INTO ListingAssignment(listid, uid)
SELECT listid, uid
FROM Accounts, Listings
WHERE Listings.listid = 1 AND uid = 2 AND uid != poster_uid AND (
  SELECT COUNT(*)
  FROM ListingAssignment
  WHERE ListingAssignment.listid = Listings.listid
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
