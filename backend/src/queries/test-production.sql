USE TungTung

-- Feature 1 account creation
INSERT INTO Users(name, phone_number, email, password) VALUES('William Huang', '647-555-1192', 'william@uwaterloo.ca', 'password123');

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
SELECT Listings.listid, Users.uid
FROM Users, Listings
WHERE Listings.listid = 80 AND Users.uid = 2 AND Listings.status = 'open'
 AND (
 SELECT COUNT(*)
 FROM AssignedTo
 WHERE AssignedTo.listid = Listings.listid
) < Listings.capacity;

-- Feature 5 adding a review
INSERT INTO Reviews (listid, reviewer_uid, reviewee_uid, rating, comment, timestamp) VALUES
(68, 35, 42, 5, 'Sharp shopper! Didn’t get distracted by the snack aisle once. Impressive.', '2026-06-25 09:00:00');

-- Fancy Feature 3 display user's total earnings
SELECT * FROM Users u LEFT OUTER JOIN (
SELECT SUM(price) total_earnings, uid
FROM Users NATURAL JOIN AssignedTo NATURAL JOIN Listings
WHERE status = 'completed'
GROUP BY uid
) earnings ON u.uid = earnings.uid
WHERE u.uid = 12; -- uid for hiroshi nakumura

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
ON B.category_id = II.category_id AND II.uid = 12 -- uid for hiroshi nakamura
GROUP BY L.listid
ORDER BY status_rank ASC, match_score DESC
LIMIT 10;
