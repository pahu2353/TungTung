SELECT * FROM Users u LEFT OUTER JOIN (
SELECT SUM(price) total_earnings, uid
FROM Users NATURAL JOIN AssignedTo NATURAL JOIN Listings
WHERE status = 'completed'
GROUP BY uid
) earnings ON u.uid = earnings.uid
WHERE u.uid = ?
