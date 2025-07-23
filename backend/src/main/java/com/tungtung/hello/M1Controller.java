package com.tungtung.hello;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
// Allow CORS
@CrossOrigin(origins = "http://localhost:3000")
public class M1Controller {

    private final JdbcTemplate jdbc;

    private static final Logger logger = LoggerFactory.getLogger(M1Controller.class);

    public M1Controller(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @RequestMapping("/hello")
    public String hello() {
        return "Hello World";
    }

    // Get all the task categories
    @GetMapping("/taskcategories")
    public List<Map<String, Object>> ListTaskCategories() {
        return jdbc.queryForList("SELECT * FROM TaskCategories");
    }

    @GetMapping("/listings")
    //see all the listings
    public List<Map<String, Object>> ListListings() {
        return jdbc.queryForList("SELECT * FROM Listings");
    }

    @GetMapping("/listings/filterAndSort")
    public List<Map<String, Object>> filterAndSortListings(
        @RequestParam(required = false) List<String> categories,
        @RequestParam(defaultValue = "all") String status,
        @RequestParam(defaultValue = "") String search,
        @RequestParam(defaultValue = "--") String sort,
        @RequestParam int uid,
        @RequestParam double latitude,
        @RequestParam double longitude
    ) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                L.*, 
                COUNT(DISTINCT II.category_id) AS category_matches,
                SQRT(POW(L.latitude - ?, 2) + POW(L.longitude - ?, 2)) AS distance,
                UNIX_TIMESTAMP(L.deadline) - UNIX_TIMESTAMP(NOW()) AS deadline_seconds,
                -- Weighted best match score (adjust weights here)
                (COUNT(DISTINCT II.category_id) * 10 
                - SQRT(POW(L.latitude - ?, 2) + POW(L.longitude - ?, 2)) * 5 
                + L.price * 1 
                - (UNIX_TIMESTAMP(L.deadline) - UNIX_TIMESTAMP(NOW())) / 3600 * 3
                ) AS match_score,
                CASE L.status 
                    WHEN 'open' THEN 1 
                    WHEN 'taken' THEN 2 
                    WHEN 'completed' THEN 3 
                    WHEN 'cancelled' THEN 4 
                    ELSE 5 
                END AS status_rank
            FROM Listings L
            JOIN BelongsTo B ON L.listid = B.listid
            JOIN TaskCategories T ON B.category_id = T.category_id
            LEFT JOIN InterestedIn II 
                ON B.category_id = II.category_id AND II.uid = ?
            WHERE 1=1
        """);

        List<Object> params = new ArrayList<>();
        params.add(latitude);
        params.add(longitude);
        params.add(uid);
        params.add(latitude);
        params.add(longitude);

        if (categories != null && !categories.isEmpty()) {
            sql.append(" AND T.category_name IN (")
            .append("?,".repeat(categories.size() - 1))
            .append("?)");
            params.addAll(categories);
        }

        if (!"all".equals(status)) {
            sql.append(" AND L.status = ?");
            params.add(status);
        }

        if (!search.isEmpty()) {
            sql.append(" AND (LOWER(L.listing_name) LIKE ? OR LOWER(L.description) LIKE ? OR LOWER(L.address) LIKE ?)");
            String q = "%" + search.toLowerCase() + "%";
            params.add(q);
            params.add(q);
            params.add(q);
        }

        sql.append(" GROUP BY L.listid");

        if (categories != null && !categories.isEmpty()) {
            sql.append(" HAVING COUNT(DISTINCT T.category_name) = ?");
            params.add(categories.size());
        }

        //add sorting
        switch (sort.toLowerCase()) {
            case "distance" -> sql.append(" ORDER BY status_rank ASC, distance ASC");
            case "price" -> sql.append(" ORDER BY status_rank ASC, L.price DESC");
            case "deadline" -> sql.append(" ORDER BY status_rank ASC, L.deadline ASC");
            case "category" -> sql.append(" ORDER BY status_rank ASC, category_matches DESC");
            case "best-match" -> sql.append(" ORDER BY status_rank ASC, match_score DESC");
            default -> sql.append(" ORDER BY status_rank ASC"); //default status order
        }

        return jdbc.queryForList(sql.toString(), params.toArray());
    }

    // get specific listing by id
    @GetMapping("/listings/{listid}")
    public Map<String, Object> getSingleListing(@PathVariable int listid) {
        String sql = "SELECT * FROM Listings WHERE listid = ?";
        return jdbc.queryForMap(sql, listid);
    }

    // Get review for listing
    @GetMapping("/listings/{listingId}/reviews")
    public List<Map<String, Object>> ListReviewsByListing(@PathVariable("listingId") int listingId) {
        String sql = "SELECT * FROM Reviews WHERE listid = ?";
        return jdbc.queryForList(sql, listingId);
    }

    // Get name from UID
    @CrossOrigin(origins = "http://localhost:3000")
    @GetMapping("/users/{uid}/name")
    public String getUserName(@PathVariable("uid") int uid) {
        String sql = "SELECT name FROM Users WHERE uid = ?";
        return jdbc.queryForObject(sql, String.class, uid);
    }

    @GetMapping("/db/seed")
    public Boolean seedDatabase() {
        Seed seed = new Seed(this.jdbc); 
        try {
            seed.populate();
        } catch (Exception e) {
            System.err.println(e);
            return false;
        }
        return true;
    }

    @CrossOrigin(origins = "http://localhost:3000")
    @PostMapping("/preferences/{uid}")
    public Boolean postPreferences(@PathVariable int uid, @RequestBody List<Integer> preferences) {
        try {
            String sql = "INSERT INTO InterestedIn (uid, category_id) VALUES (?, ?)";

            List<Object[]> batchParams = new ArrayList<>();
            for (Integer categoryId : preferences) {
                batchParams.add(new Object[]{uid, categoryId});
            }

            jdbc.batchUpdate(sql, batchParams);
        } catch (Exception e) {
            System.err.println(e);
            return false;
        }
        return true;
    }


    // Create user's account
    @CrossOrigin(origins = "http://localhost:3000")
    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody Map<String, String> userData) {
        Map<String, Object> response = new HashMap<>();

        try {
            String name = userData.get("name");
            String email = userData.get("email");
            String password = userData.get("password");
            String hashedPassword = Hasher.hashPassword(password);
            String phoneNumber = userData.get("phone_number");

            // Validate missing email, name, etc.
            if (name == null || name.trim().isEmpty()) {
                response.put("error", "Name is required");
                return ResponseEntity.badRequest().body(response);
            }

            if ((email == null || email.isEmpty()) && (phoneNumber == null || phoneNumber.isEmpty())) {
                response.put("error", "Either email or phone number is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (password == null || password.trim().isEmpty()) {
                response.put("error", "Password is required");
                return ResponseEntity.badRequest().body(response);
            }

            // Check duplicates
            if (email != null && !email.isEmpty()) {
                String checkEmailSql = "SELECT COUNT(*) FROM Users WHERE email = ?";
                int emailCount = jdbc.queryForObject(checkEmailSql, Integer.class, email);
                if (emailCount > 0) {
                    response.put("error", "Email is already registered");
                    return ResponseEntity.badRequest().body(response);
                }
            }

            if (phoneNumber != null && !phoneNumber.isEmpty()) {
                String checkPhoneSql = "SELECT COUNT(*) FROM Users WHERE phone_number = ?";
                int phoneCount = jdbc.queryForObject(checkPhoneSql, Integer.class, phoneNumber);
                if (phoneCount > 0) {
                    response.put("error", "Phone number is already registered");
                    return ResponseEntity.badRequest().body(response);
                }
            }

            // Generate profile picture path
            int hash = Math.abs(name.hashCode());
            int catNumber = (hash % 7) + 1; // Ensure the result is between 1 and 7
            String profilePicture = "/cat" + catNumber + ".jpg";

            String sql = "INSERT INTO Users (name, email, phone_number, profile_picture, password) VALUES (?, ?, ?, ?, ?)";

            // Run the query and grab the UID, storing it in keyHolder
            KeyHolder keyHolder = new GeneratedKeyHolder();

            jdbc.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, name.trim());
                ps.setString(2, email.trim());
                ps.setString(3, phoneNumber != null && !phoneNumber.trim().isEmpty() ? phoneNumber.trim() : null);
                ps.setString(4, profilePicture); 
                ps.setString(5, hashedPassword);
                return ps;
            }, keyHolder);

            int newUid = keyHolder.getKey().intValue();

            response.put("uid", newUid);
            response.put("name", name);
            response.put("email", email);
            response.put("phone_number", phoneNumber);
            response.put("profile_picture", profilePicture); 
            response.put("total_earnings", 0);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error during signup: {}", e.getMessage(), e);
            
            response.put("error", "An error occurred during registration. Please try again.");
            return ResponseEntity.badRequest().body(response);
        }
    }

    // We want users to be able to sign in with phone number as well
    // so check if it's an email before we query
    private boolean isEmail(String input) {
        return input != null && input.contains("@") && input.contains(".");
    }

    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null) return null;
        // Removes spaces, hyphens, parentheses
        return phoneNumber.replaceAll("[\\s\\-\\(\\)\\+]", "");
    }

    // Log user in
    @CrossOrigin(origins = "http://localhost:3000")
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginData) {
        logger.info("Login endpoint called with data: {}", loginData);
        
        Map<String, Object> response = new HashMap<>();

        try {
            String email = loginData.get("email");
            String phoneNumber = loginData.get("phone_number");
            String password = loginData.get("password");
            String hashedPassword = Hasher.hashPassword(password);

            // clean values to trim whitespace
            if (email != null) {
                email = email.trim();
            }
            if (phoneNumber != null) {
                phoneNumber = phoneNumber.trim();
                phoneNumber = normalizePhoneNumber(phoneNumber);
            }

            logger.info("Parsed login data - Email: {}, Phone Number: {}, Hashed Password: {}", email, phoneNumber, hashedPassword);

            // Allow users to log in either with email or with phone number
            if ((email == null || email.isEmpty()) && (phoneNumber == null || phoneNumber.isEmpty())) {
                response.put("error", "Email or phone number is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (password == null || password.trim().isEmpty()) {
                response.put("error", "Password is required");
                return ResponseEntity.badRequest().body(response);
            }

            String sql;
            Object parameter; // Either email or phone_number

            // Check whether user gave us an email or a phone number
            if (email != null && !email.trim().isEmpty() && isEmail(email)) {
                sql = "SELECT uid, password FROM Users WHERE email = ?";
                parameter = email.trim();
            } else {
                sql = "SELECT uid, password FROM Users WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') = ?";
                parameter = phoneNumber.trim();
            }

            Map<String, Object> credentials = jdbc.queryForMap(sql, parameter);
            
            // check for password
            if (!hashedPassword.equals(credentials.get("password"))) {
                response.put("error", "Incorrect credentials");
                return ResponseEntity.badRequest().body(response);
            }

            // call getUserProfile to populate their profile
            int uid = ((Number) credentials.get("uid")).intValue();
            ResponseEntity<Map<String, Object>> profileResponse = getUserProfile(uid);
            
            if (profileResponse.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.ok(profileResponse.getBody());
            } else {
                return profileResponse;
            }

    } catch (Exception e) {
        logger.error("Login error: {}", e.getMessage(), e);
        response.put("error", "User not found");
        return ResponseEntity.badRequest().body(response);
    }
}

    // Create new listing
    @CrossOrigin(origins = "http://localhost:3000")
    @PostMapping("/listings")
    public ResponseEntity<Map<String, Object>> createListing(@RequestBody Map<String, Object> listingData) {
        Map<String, Object> response = new HashMap<>();

        try {
            String listingName = (String) listingData.get("listing_name");
            String description = (String) listingData.get("description");
            Integer capacity = (Integer) listingData.get("capacity");
            Double price = ((Number) listingData.get("price")).doubleValue();
            Integer duration = (Integer) listingData.get("duration");
            String deadlineString = (String) listingData.get("deadline");
            String address = (String) listingData.get("address");
            Double longitude = ((Number) listingData.get("longitude")).doubleValue();
            Double latitude = ((Number) listingData.get("latitude")).doubleValue();
            Integer posterUid = (Integer) listingData.get("poster_uid");
            @SuppressWarnings("unchecked")
            List<Integer> categoryIds = (List<Integer>) listingData.get("category_ids");

            if (listingName == null || listingName.trim().isEmpty()) {
                response.put("error", "Listing name is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (price == null || price < 0) {
                response.put("error", "Valid price is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (capacity == null || capacity <= 0) {
                response.put("error", "Capacity must be greater than 0");
                return ResponseEntity.badRequest().body(response);
            }

            if (duration == null || duration <= 0) {
                response.put("error", "Duration must be greater than 0");
                return ResponseEntity.badRequest().body(response);
            }

            if (deadlineString == null || deadlineString.trim().isEmpty()) {
                response.put("error", "Deadline is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (address == null || address.trim().isEmpty()) {
                response.put("error", "Address is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (posterUid == null) {
                response.put("error", "User must be logged in to create listing");
                return ResponseEntity.badRequest().body(response);
            }

            if (categoryIds == null || categoryIds.isEmpty()) {
                response.put("error", "At least one category must be selected");
                return ResponseEntity.badRequest().body(response);
            }

            java.sql.Timestamp deadline;
            try {
                java.time.Instant instant = java.time.Instant.parse(deadlineString);
                deadline = java.sql.Timestamp.from(instant);
            } catch (Exception e) {
                response.put("error", "Invalid deadline format");
                return ResponseEntity.badRequest().body(response);
            }

            java.sql.Timestamp now = new java.sql.Timestamp(System.currentTimeMillis());
            java.sql.Timestamp minDeadline = new java.sql.Timestamp(now.getTime() + (duration * 60 * 1000L));
            
            if (deadline.before(minDeadline)) {
                response.put("error", "Deadline must be at least " + duration + " minutes from now");
                return ResponseEntity.badRequest().body(response);
            }

            // Current timestamp is posting time
            String listingSql = "INSERT INTO Listings (listing_name, description, capacity, price, duration, address, longitude, latitude, posting_time, deadline, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')";

            KeyHolder keyHolder = new GeneratedKeyHolder();
            
            jdbc.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(listingSql, Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, listingName.trim());
                ps.setString(2, description != null ? description.trim() : null);
                ps.setInt(3, capacity);
                ps.setDouble(4, price);
                ps.setInt(5, duration);
                ps.setString(6, address.trim());
                ps.setDouble(7, longitude);
                ps.setDouble(8, latitude);
                ps.setTimestamp(9, now); // posting_time
                ps.setTimestamp(10, deadline);
                return ps;
            }, keyHolder);

            int newListingId = keyHolder.getKey().intValue();

            // Insert into Posts and BelongsTo table
            String postsSql = "INSERT INTO Posts (listid, uid) VALUES (?, ?)";
            jdbc.update(postsSql, newListingId, posterUid);

            String belongsToSql = "INSERT INTO BelongsTo (listid, category_id) VALUES (?, ?)";
            for (Integer categoryId : categoryIds) {
                jdbc.update(belongsToSql, newListingId, categoryId);
            }

            response.put("listid", newListingId);
            response.put("message", "Listing created successfully");
            response.put("deadline", deadline.toString());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error creating listing: " + e.getMessage());
            e.printStackTrace();
            response.put("error", "Failed to create listing. Please try again.");
            return ResponseEntity.badRequest().body(response);
        }
    }

    //assign user to listing
    @PostMapping("/listings/{listid}/assign/{uid}")
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public ResponseEntity<String> assignTask(@PathVariable int listid, @PathVariable int uid) {
        try {
            // Lock the listing row with FOR UPDATE, prevents concurrent assignment
            String checkListingSql = "SELECT status, capacity FROM Listings WHERE listid = ? FOR UPDATE";
            Map<String, Object> listing;
            
            try {
                listing = jdbc.queryForMap(checkListingSql, listid);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Listing not found.");
            }
            
            //check if listing is open
            String status = (String) listing.get("status");
            if (!"open".equalsIgnoreCase(status)) {
                return ResponseEntity.badRequest().body("Listing is not open.");
            }
            
            //check if user is the poster (also with lock)
            String posterCheckSql = "SELECT COUNT(*) FROM Posts WHERE listid = ? AND uid = ?";
            int isPoster = jdbc.queryForObject(posterCheckSql, Integer.class, listid, uid);
            if (isPoster > 0) {
                return ResponseEntity.badRequest().body("You cannot take your own task.");
            }
            
            // checks if user already assigned
            String alreadyAssignedSql = "SELECT COUNT(*) FROM AssignedTo WHERE listid = ? AND uid = ?";
            int isAssigned = jdbc.queryForObject(alreadyAssignedSql, Integer.class, listid, uid);
            if (isAssigned > 0) {
                return ResponseEntity.badRequest().body("You are already assigned to this task.");
            }
            
            // Check if listing is full, for update prevents race conditions
            String countSql = "SELECT COUNT(*) FROM AssignedTo WHERE listid = ? FOR UPDATE";
            int assigned = jdbc.queryForObject(countSql, Integer.class, listid);
            
            int capacity = ((Number) listing.get("capacity")).intValue();
            
            if (assigned >= capacity) {
                return ResponseEntity.badRequest().body("Task already full.");
            }

            //insert into AssignedTo 
            String insertSql = "INSERT INTO AssignedTo(listid, uid) VALUES (?, ?)";
            jdbc.update(insertSql, listid, uid);

            //update Listings.status if needed
            return ResponseEntity.ok("Successfully assigned task.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Database error: " + e.getMessage());
        }
    }

    //unassign user from listing
    @PostMapping("/listings/{listid}/unassign/{uid}")
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public ResponseEntity<String> unassignTask(@PathVariable int listid, @PathVariable int uid) {
        try {
            // Lock the listing row with FOR UPDATE, prevents concurrent changes
            String checkListingSql = "SELECT status FROM Listings WHERE listid = ? FOR UPDATE";
            Map<String, Object> listing;
            
            try {
                listing = jdbc.queryForMap(checkListingSql, listid);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Listing not found.");
            }
            
            // Check if listing is in a state that allows unassignment
            String status = (String) listing.get("status");
            if ("completed".equalsIgnoreCase(status) || "cancelled".equalsIgnoreCase(status)) {
                return ResponseEntity.badRequest().body("Cannot unassign from a completed or cancelled listing.");
            }
            
            // Check if the user is actually assigned to this listing
            String checkAssignedSql = "SELECT COUNT(*) FROM AssignedTo WHERE listid = ? AND uid = ?";
            int isAssigned = jdbc.queryForObject(checkAssignedSql, Integer.class, listid, uid);
            
            if (isAssigned == 0) {
                return ResponseEntity.badRequest().body("You are not assigned to this task.");
            }
            
            // Remove the assignment
            String deleteSql = "DELETE FROM AssignedTo WHERE listid = ? AND uid = ?";
            jdbc.update(deleteSql, listid, uid);
            
            // Update the listing status back to open if currently taken
            if ("taken".equalsIgnoreCase(status)) {
                String updateStatusSql = "UPDATE Listings SET status = 'open' WHERE listid = ?";
                jdbc.update(updateStatusSql, listid);
            }
            
            return ResponseEntity.ok("Successfully unassigned from task.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Database error: " + e.getMessage());
        }
    }

    //get assigned users for each listing
    @GetMapping("/listings/{listid}/assigned-users")
    public List<Map<String, Object>> getAssignedUsers(@PathVariable int listid) {
        String sql = "SELECT U.uid, U.name, U.profile_picture FROM AssignedTo A JOIN Users U ON A.uid = U.uid WHERE A.listid = ?";
        return jdbc.queryForList(sql, listid);
    }

    @CrossOrigin(origins = "http://localhost:3000")
    @GetMapping("/profile/{uid}")
    public ResponseEntity<Map<String, Object>> getUserProfile(@PathVariable("uid") int uid) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Total earnings
            String userSql = """
                SELECT * FROM Users u LEFT OUTER JOIN (
                    SELECT SUM(price) total_earnings, uid
                    FROM Users NATURAL JOIN AssignedTo NATURAL JOIN Listings
                    WHERE status = 'completed'
                    GROUP BY uid
                ) earnings ON u.uid = earnings.uid
                WHERE u.uid = ?
            """;
            
            Map<String, Object> user = jdbc.queryForMap(userSql, uid);
            
            // We don't need password (and it's bad security to include it D:)
            user.remove("password");
            
            String reviewSql = """
                SELECT r.*, u.name AS reviewer_name, listing_name FROM Reviews r 
                JOIN Users u ON r.reviewer_uid = u.uid 
                JOIN Listings l ON r.listid = l.listid
                WHERE reviewee_uid = ?
            """;
            List<Map<String, Object>> reviews = jdbc.queryForList(reviewSql, uid);
            user.put("reviews", reviews);
            
            // Get listings that user created
            String createdListingsSql = """
                SELECT l.* 
                FROM Listings l 
                JOIN Posts p ON l.listid = p.listid 
                WHERE p.uid = ?
            """;
            List<Map<String, Object>> createdListings = jdbc.queryForList(createdListingsSql, uid);
            user.put("created_listings", createdListings);
            
            // Get listings assigned to this user
            String assignedListingsSql = """
                SELECT l.* 
                FROM Listings l 
                JOIN AssignedTo a ON l.listid = a.listid 
                WHERE a.uid = ?
            """;
            List<Map<String, Object>> assignedListings = jdbc.queryForList(assignedListingsSql, uid);
            user.put("assigned_listings", assignedListings);
            
            return ResponseEntity.ok(user);
            
        } catch (Exception e) {
            logger.error("Error fetching user profile: {}", e.getMessage(), e);
            response.put("error", "User not found");
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Mark a listing as complete
    @PostMapping("/listings/{listid}/complete")
    public ResponseEntity<String> markListingComplete(@PathVariable int listid, @RequestBody Map<String, Integer> requestBody) {
        try {
            Integer posterUid = requestBody.get("poster_uid");
            
            if (posterUid == null) {
                return ResponseEntity.badRequest().body("User ID is required");
            }
            
            // Make sure we're the poster (otherwise you can't mark as complete obviously)
            String posterCheckSql = "SELECT COUNT(*) FROM Posts WHERE listid = ? AND uid = ?";
            int isPoster = jdbc.queryForObject(posterCheckSql, Integer.class, listid, posterUid);
            
            if (isPoster == 0) {
                return ResponseEntity.badRequest().body("Only the task creator can mark it as complete");
            }
            
            String statusSql = "SELECT status FROM Listings WHERE listid = ?";
            String currentStatus = jdbc.queryForObject(statusSql, String.class, listid);
            
            if ("completed".equals(currentStatus) || "cancelled".equals(currentStatus)) {
                return ResponseEntity.badRequest().body("This task is already marked as " + currentStatus);
            }
            
            if (!"taken".equals(currentStatus)) {
                return ResponseEntity.badRequest().body("This task must be assigned to someone before marking as complete");
            }
            
            // Update the status to completed
            String updateSql = "UPDATE Listings SET status = 'completed' WHERE listid = ?";
            jdbc.update(updateSql, listid);
            
            return ResponseEntity.ok("Task marked as complete");
        } catch (Exception e) {
            logger.error("Error marking listing as complete: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Database error: " + e.getMessage());
        }
    }

    // Create a review (after a posting is completed)
    // Triggers ensure that reviewer is the person who posted
    @PostMapping("/reviews")
    public ResponseEntity<Map<String, Object>> createReview(@RequestBody Map<String, Object> reviewData) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Integer listid = (Integer) reviewData.get("listid");
            Integer reviewerUid = (Integer) reviewData.get("reviewer_uid");
            Integer revieweeUid = (Integer) reviewData.get("reviewee_uid");
            Integer rating = (Integer) reviewData.get("rating");
            String comment = (String) reviewData.get("comment");
            
            if (listid == null || reviewerUid == null || revieweeUid == null || rating == null) {
                response.put("error", "Missing required fields");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (rating < 1 || rating > 5) {
                response.put("error", "Rating must be between 1 and 5");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (reviewerUid.equals(revieweeUid)) {
                response.put("error", "You cannot review yourself");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check if listing exists and is completed
            String listingSql = "SELECT status FROM Listings WHERE listid = ?";
            String listingStatus;
            try {
                listingStatus = jdbc.queryForObject(listingSql, String.class, listid);
            } catch (Exception e) {
                response.put("error", "Listing not found");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!"completed".equals(listingStatus)) {
                response.put("error", "Only completed listings can be reviewed");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Some checks, though we also have triggers
            String posterCheckSql = "SELECT COUNT(*) FROM Posts WHERE listid = ? AND uid = ?";
            int isPoster = jdbc.queryForObject(posterCheckSql, Integer.class, listid, reviewerUid);
            
            if (isPoster == 0) {
                response.put("error", "Only the task creator can leave reviews");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check if reviewee was assigned to the listing
            String assignedCheckSql = "SELECT COUNT(*) FROM AssignedTo WHERE listid = ? AND uid = ?";
            int isAssigned = jdbc.queryForObject(assignedCheckSql, Integer.class, listid, revieweeUid);
            
            if (isAssigned == 0) {
                response.put("error", "You can only review users who were assigned to this task");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check if review already exists
            String reviewExistsSql = "SELECT COUNT(*) FROM Reviews WHERE listid = ? AND reviewer_uid = ? AND reviewee_uid = ?";
            int reviewExists = jdbc.queryForObject(reviewExistsSql, Integer.class, listid, reviewerUid, revieweeUid);
            
            if (reviewExists > 0) {
                // Update existing review
                String updateSql = "UPDATE Reviews SET rating = ?, comment = ?, timestamp = CURRENT_TIMESTAMP WHERE listid = ? AND reviewer_uid = ? AND reviewee_uid = ?";
                jdbc.update(updateSql, rating, comment, listid, reviewerUid, revieweeUid);
                
                response.put("message", "Review updated successfully");
            } else {
                // Insert new review
                String insertSql = "INSERT INTO Reviews (listid, reviewer_uid, reviewee_uid, rating, comment) VALUES (?, ?, ?, ?, ?)";
                jdbc.update(insertSql, listid, reviewerUid, revieweeUid, rating, comment);
                
                response.put("message", "Review submitted successfully");
            }
            
            // Update user's overall rating
            String updateRatingSql = """
                UPDATE Users
                SET overall_rating = (
                    SELECT AVG(rating)
                    FROM Reviews
                    WHERE reviewee_uid = ?
                )
                WHERE uid = ?
            """;
            jdbc.update(updateRatingSql, revieweeUid, revieweeUid);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error creating review: {}", e.getMessage(), e);
            response.put("error", "Failed to submit review");
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
