INSERT INTO Accounts(name, phone_number, email) VALUES('William Huang', '647-555-1192', 'william@uwaterloo.ca');

INSERT INTO Listings
  (listing_name, description, poster_uid, capacity, price, duration, address, longitude, latitude, deadline, status)
VALUES
  ('Window Cleaning', 'I need the best of the best, will pay extra in tips for a good job!', 1, 2, 45.45, 1, '99 Queen St, Toronto, ON', 123.9, 44.2, '2026-07-23', 'open');

INSERT INTO ListingAssignment(listid, uid)
SELECT listid, uid
FROM Accounts, Listings
WHERE Listings.listid = 1 AND uid = 2 AND uid != poster_uid AND (
  SELECT COUNT(*)
  FROM ListingAssignment
  WHERE ListingAssignment.listid = Listings.listid
) < Listings.capacity;

UPDATE Listings
SET status = 'completed'
WHERE listid = 1;

INSERT INTO Reviews(listid, reviewer_uid, reviewee_uid, rating, comment)
VALUES(1, 2, 1, 1, 'HORRIBLE CLEANING SERVICE I HATE YOU');

SELECT * FROM TaskCategories;

