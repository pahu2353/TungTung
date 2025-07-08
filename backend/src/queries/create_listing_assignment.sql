INSERT INTO AssignedTo(listid, uid)
SELECT listid, uid
FROM Users, Listings
WHERE Listings.listid = ? AND uid = ? AND uid != poster_uid AND Listing.status = 'open' AND (
  SELECT COUNT(*)
  FROM AssignedTo
  WHERE AssignedTo.listid = Listings.listid
) < Listings.capacity;
