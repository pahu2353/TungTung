CREATE VIEW total_earnings_for_user AS
SELECT SUM(price) total_earnings
FROM Users NATURAL JOIN AssignedTo NATURAL JOIN Listings
Where Listings.status = 'completed' AND Users.uid = ?;