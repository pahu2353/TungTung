USE TungTung

-- Feature 1 account creation
INSERT INTO Users(name, phone_number, email) VALUES('William Huang', '647-555-1192', 'william@uwaterloo.ca');

-- Feature 2 get list of categories
SELECT * FROM TaskCategories;

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
SELECT listid, uid
FROM Users, Listings
WHERE Listings.listid = 80 AND uid = 2 AND Listing.status = 'open'
 AND (
 SELECT COUNT(*)
 FROM AssignedTo
 WHERE AssignedTo.listid = Listings.listid
) < Listings.capacity;

-- Feature 5 adding a review
INSERT INTO Reviews (listid, reviewer_uid, reviewee_uid, rating, comment, timestamp) VALUES
(68, 42, 35, 5, 'Sharp shopper! Didn’t get distracted by the snack aisle once. Impressive.', '2026-06-25 09:00:00');