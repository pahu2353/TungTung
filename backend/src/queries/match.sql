SELECT 
L.*, 
COUNT(DISTINCT II.category_id) AS category_matches,
SQRT(POW(L.latitude - ?, 2) + POW(L.longitude - ?, 2)) AS distance,
UNIX_TIMESTAMP(L.deadline) - UNIX_TIMESTAMP(NOW()) AS deadline_seconds,
-- Weighted best match score
(
    COUNT(DISTINCT II.category_id) * 75
    + (L.price/L.duration) * 10
    - (UNIX_TIMESTAMP(L.deadline) - UNIX_TIMESTAMP(NOW())) / 60000
    - SQRT(POW(L.latitude - ?, 2) + POW(L.longitude - ?, 2)) * 1
) AS match_score,
CASE L.status 
    WHEN 'open' THEN 1 
    WHEN 'taken' THEN 2 
    WHEN 'completed' THEN 3 
    WHEN 'cancelled' THEN 4 
    ELSE 5 
END AS status_rank
-- show listings in order of open, taken, completed, cancelled
FROM Listings L
LEFT JOIN BelongsTo B ON L.listid = B.listid
LEFT JOIN InterestedIn II 
ON B.category_id = II.category_id AND II.uid = ?
GROUP BY L.listid
ORDER BY status_rank ASC, match_score DESC
