INSERT INTO ListingAssignment(listid, uid)
SELECT listid, uid
FROM Accounts, Listings
WHERE Listings.listid = ? AND uid = ? AND uid != poster_uid AND Listing.status = 'open' AND (
  SELECT COUNT(*)
  FROM ListingAssignment
  WHERE ListingAssignment.listid = Listings.listid
) < Listings.capacity;
