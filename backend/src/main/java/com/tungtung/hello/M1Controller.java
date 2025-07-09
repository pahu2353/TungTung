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

@RestController
// Allow CORS
@CrossOrigin(origins = "http://localhost:3000")
public class M1Controller {

    private final JdbcTemplate jdbc;

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
            Seed.createAccounts();

            Seed.createListings();
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

            if (email == null || email.trim().isEmpty()) {
                response.put("error", "Email is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (password == null || password.trim().isEmpty()) {
                response.put("error", "Password is required");
                return ResponseEntity.badRequest().body(response);
            }

            String sql = "INSERT INTO Users (name, email, phone_number) VALUES (?, ?, ?)";

            // Run the query and grab the UID, storing it in keyHolder
            KeyHolder keyHolder = new GeneratedKeyHolder();

            jdbc.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, name.trim());
                ps.setString(2, email.trim());
                ps.setString(3, phoneNumber != null && !phoneNumber.trim().isEmpty() ? phoneNumber.trim() : null);
                return ps;
            }, keyHolder);

            int newUid = keyHolder.getKey().intValue();

            response.put("uid", newUid);
            response.put("name", name.trim());
            response.put("email", email.trim());
            response.put("phone_number", phoneNumber);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
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
        Map<String, Object> response = new HashMap<>();

        try {
            String email = loginData.get("email");
            String phoneNumber = loginData.get("phone_number");
            String password = loginData.get("password"); // WIP

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
                sql = "SELECT uid, name, email, phone_number FROM Users WHERE email = ?";
                parameter = email.trim();
            } else {
                sql = "SELECT uid, name, email, phone_number FROM Users WHERE phone_number = ?";
                parameter = phoneNumber.trim();
            }

            Map<String, Object> user = jdbc.queryForMap(sql, parameter);

            return ResponseEntity.ok(user);

        } catch (Exception e) {
            response.put("error", "User not found");
            return ResponseEntity.badRequest().body(response);
        }
    }
}
