INSERT INTO AssignedTo(listid, uid)
SELECT listid, uid
FROM Users, Listings
JOIN Posts ON Listings.listid = Posts.listid
WHERE Listings.listid = ? AND uid = ? AND uid != Posts.uid AND Listing.status = 'open' AND (
  SELECT COUNT(*)
  FROM AssignedTo
  WHERE AssignedTo.listid = Listings.listid
) < Listings.capacity;
