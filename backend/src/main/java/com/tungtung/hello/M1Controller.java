package com.tungtung.hello;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.HashMap;
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
    // See all the listings
    public List<Map<String, Object>> ListListings() {
        return jdbc.queryForList("SELECT * FROM Listings");
    }

    @GetMapping("/listings/filter")
    // See filtered listings by selected categories
    public List<Map<String, Object>> filterListings(
        @RequestParam List<String> categories
    ) {
        if (categories == null || categories.isEmpty()) {
            return jdbc.queryForList("SELECT * FROM Listings");
        }

        String placeholders = String.join(",", categories.stream().map(c -> "?").toList());

        String sql =
            "SELECT DISTINCT L.* " +
            "FROM Listings L " +
            "JOIN BelongsTo B ON L.listid = B.listid " +
            "JOIN TaskCategories T ON B.category_id = T.category_id " +
            "WHERE T.category_name IN (" + placeholders + ")" + 
            "GROUP BY L.listid " +
            "HAVING COUNT(DISTINCT T.category_name) = ?";
            
        List<Object> params = new java.util.ArrayList<>(categories);
        params.add(categories.size()); // append the count for HAVING

        return jdbc.queryForList(sql, params.toArray());
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

    // fix this
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

    // Create user's account
    @CrossOrigin(origins = "http://localhost:3000")
    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody Map<String, String> userData) {
        Map<String, Object> response = new HashMap<>();

        try {
            String name = userData.get("name");
            String email = userData.get("email");
            String password = userData.get("password"); // WIP
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

            // Generate profile picture path
            int hash = Math.abs(name.hashCode());
            int catNumber = (hash % 7) + 1; // Ensure the result is between 1 and 7
            String profilePicture = "/cat" + catNumber + ".jpg";

            String sql = "INSERT INTO Users (name, email, phone_number, profile_picture) VALUES (?, ?, ?, ?)";

            // Run the query and grab the UID, storing it in keyHolder
            KeyHolder keyHolder = new GeneratedKeyHolder();

            jdbc.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, name.trim());
                ps.setString(2, email.trim());
                ps.setString(3, phoneNumber != null && !phoneNumber.trim().isEmpty() ? phoneNumber.trim() : null);
                ps.setString(4, profilePicture); 
                return ps;
            }, keyHolder);

            int newUid = keyHolder.getKey().intValue();

            response.put("uid", newUid);
            response.put("name", name.trim());
            response.put("email", email.trim());
            response.put("phone_number", phoneNumber);
            response.put("profile_picture", profilePicture); 
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error during signup: {}", e.getMessage(), e); // Log the exception

            response.put("error", "Either the email already exists or you have invalid data. Try again!");
            return ResponseEntity.badRequest().body(response);
        }
    }

    // We want users to be able to sign in with phone number as well
    // so check if it's an email before we query
    private boolean isEmail(String input) {
        return input != null && input.contains("@") && input.contains(".");
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
            String password = loginData.get("password"); // WIP

            logger.info("Parsed login data - Email: {}, Phone Number: {}, Password: {}", email, phoneNumber, password);
            
            // clean values to trim whitespace
            if (email != null)
                email = email.trim();
            if (phoneNumber != null)
                phoneNumber = phoneNumber.trim();

            // Allow users to log in either with email or with phone number
            if ((email == null || email.trim().isEmpty()) &&
                    (phoneNumber == null || phoneNumber.trim().isEmpty())) {
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
                sql = "SELECT uid, name, email, phone_number, profile_picture, overall_rating FROM Users WHERE email = ?";
                parameter = email.trim();
            } else {
                sql = "SELECT uid, name, email, phone_number, profile_picture, overall_rating FROM Users WHERE phone_number = ?";
                parameter = phoneNumber.trim();
            }

            Map<String, Object> user = jdbc.queryForMap(sql, parameter);
            logger.info("Login successful for user: {}", user);

            return ResponseEntity.ok(user);

        } catch (Exception e) {
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
    public ResponseEntity<String> assignTask(@PathVariable int listid, @PathVariable int uid) {
        try {
            //check if listing is open
            String statusSql = "SELECT status FROM Listings WHERE listid = ?";
            String status = jdbc.queryForObject(statusSql, String.class, listid);
            if (!"open".equalsIgnoreCase(status)) {
                return ResponseEntity.badRequest().body("Listing is not open.");
            }

            //check if user is the poster
            String posterCheckSql = "SELECT COUNT(*) FROM Posts WHERE listid = ? AND uid = ?";
            int isPoster = jdbc.queryForObject(posterCheckSql, Integer.class, listid, uid);
            if (isPoster > 0) {
                return ResponseEntity.badRequest().body("You cannot take your own task.");
            }

            //check if listing is full
            String countSql = "SELECT COUNT(*) FROM AssignedTo WHERE listid = ?";
            int assigned = jdbc.queryForObject(countSql, Integer.class, listid);

            String capacitySql = "SELECT capacity FROM Listings WHERE listid = ?";
            int capacity = jdbc.queryForObject(capacitySql, Integer.class, listid);

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
}
