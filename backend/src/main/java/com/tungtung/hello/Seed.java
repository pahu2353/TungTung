package com.tungtung.hello;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.HashSet;
import java.util.HashMap;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;

import com.github.javafaker.Faker;
import com.github.javafaker.Address;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

public class Seed {
  private final JdbcTemplate jdbc;
  private Faker faker;
  private int postingVolume;
  private Set<Integer> completedTasks;
  private List<Integer> listToAuthor;
  private Map<Integer,Integer> listingToUser;
  private int numCategories;
  private int numUsers;

  public Seed(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
    this.faker = new Faker();
    this.postingVolume = 0;
    this.completedTasks = new HashSet<>();
    this.listToAuthor = new ArrayList<>();
    this.listingToUser = new HashMap<>();
    this.numCategories = 10;
    this.numUsers = 50;
  }

  public void populate() {
    this.clearDb();
    this.createAccounts();
    this.createCategories();
    this.createListings();
    this.createListingAssignments(); // First assign users to listings
    this.updateListings();           // Then update statuses (including to "completed")
    this.createReviews();            // Finally create reviews for completed, assigned listings
  }

  public void clearDb() {
    this.jdbc.execute("SET FOREIGN_KEY_CHECKS = 0");
    
    this.jdbc.batchUpdate(
      "TRUNCATE TABLE Users",
      "TRUNCATE TABLE Reviews",
      "TRUNCATE TABLE AssignedTo",
      "TRUNCATE TABLE InterestedIn",
      "TRUNCATE TABLE BelongsTo",
      "TRUNCATE TABLE Listings",
      "TRUNCATE TABLE TaskCategories",
      "TRUNCATE TABLE Posts"
    );
    
    this.jdbc.execute("SET FOREIGN_KEY_CHECKS = 1");
}


  public void createAccounts() {
    String sql = """
      INSERT INTO Users
        (name, profile_picture, phone_number, email)
      VALUES (?, ?, ?, ?)
      """;
    List<Object[]> userList = new ArrayList<>();

    for (int i = 0; i < numUsers; i++) {
        String name  = this.faker.name().firstName() + " " + this.faker.name().lastName();
        String pfp   = this.faker.internet().avatar();
        String phone = this.faker.phoneNumber().phoneNumber();
        String email = this.faker.internet().emailAddress();

        userList.add(new Object[]{ name, pfp, phone, email });
    }

    this.jdbc.batchUpdate(sql, userList);
  }

  public void createListings() {
    int postingId = 1;
    Random rnd = new Random();
    List<Object[]> listingPosts = new ArrayList<>();
    List<Object[]> categoryListings = new ArrayList<>();
    for (int id = 1; id <= numUsers; id++) {
      int postings = rnd.nextInt(6);
      for (int posting = 0; posting < postings; posting++, postingId++) {
        // make posting for user 'id'
        String postingSql = """
            INSERT INTO Listings
              (listing_name, description, capacity, price, duration, address, longitude, latitude, deadline, status)
            VALUES
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """;

        int capacity = rnd.nextInt(3) + 1;
        float price = rnd.nextFloat(150) + 3;
        int duration = rnd.nextInt(4) + 1;

        Address address = this.faker.address();

        this.jdbc.update(
          postingSql, 
          this.faker.book().title(),
          this.faker.leagueOfLegends().quote(),
          capacity,
          price,
          duration,
          address.fullAddress(),
          address.longitude(),
          address.latitude(),
          this.faker.date().future(365, TimeUnit.DAYS),
          "open"
        );

        listingPosts.add(new Object[] {postingId, id});
        this.listToAuthor.add(id);

        // pick categories for each posting
        int categories = rnd.nextInt(4);  // 0–3 distinct picks

        List<Integer> pool = new ArrayList<>();
        for (int i = 1; i <= numCategories; i++) pool.add(i);

        Collections.shuffle(pool, rnd);

        for (int i = 0; i < categories; i++) {
          int category = pool.get(i);
          categoryListings.add(new Object[] {postingId, category});
        }
      }
    }
    String postsSql = "INSERT INTO Posts VALUES(?, ?)";
    String categoryListSql = "INSERT INTO BelongsTo Values(?, ?)";
    this.jdbc.batchUpdate(postsSql, listingPosts);
    this.jdbc.batchUpdate(categoryListSql, categoryListings);

    this.postingVolume = postingId - 1;
  }

  public void createCategories() {
    String sql = "INSERT INTO TaskCategories(category_name) VALUES(?)";
    
    Set<String> uniqueCategories = new LinkedHashSet<>();
    while (uniqueCategories.size() < numCategories) {
      uniqueCategories.add(this.faker.leagueOfLegends().champion());
    }
    
    List<Object[]> batchArgs = uniqueCategories.stream()
        .map(name -> new Object[]{ name })
        .collect(Collectors.toList());
    
    this.jdbc.batchUpdate(sql, batchArgs);
  }

  public void createReviews() {
    System.out.println("Creating reviews...");
    System.out.println("Completed tasks: " + this.completedTasks.size());
    System.out.println("Assigned users: " + this.listingToUser.size());
    
    Random rnd = new Random();
    String sql = "INSERT INTO Reviews(listid, reviewer_uid, reviewee_uid, rating, comment) VALUES(?, ?, ?, ?, ?)";
    int reviewsCreated = 0;
    
    for (int listing : this.completedTasks) {
        if (this.listingToUser.containsKey(listing)) {
            int reviewer = listingToUser.get(listing);
            int reviewee = this.listToAuthor.get(listing - 1);
            int rating = rnd.nextInt(5) + 1;
            String comment = this.faker.yoda().quote();

            try {
                this.jdbc.update(sql, listing, reviewer, reviewee, rating, comment);
                reviewsCreated++;
            } catch (Exception e) {
                System.out.println("Error creating review for listing " + listing + ": " + e.getMessage());
            }
        }
    }
    
    System.out.println("Successfully created " + reviewsCreated + " reviews");
  }

  public void createListingAssignments() {
    Random rnd = new Random();
    List<Object[]> listAssigns = new ArrayList<>();
    
    String openListingsSql = "SELECT listid FROM Listings WHERE status = 'open'";
    List<Integer> openListings = jdbc.queryForList(openListingsSql, Integer.class);
    
    if (openListings.isEmpty()) {
        System.out.println("Warning: No open listings available for assignment");
        return;
    }
    
    int assignmentsMade = 0;
    for (int i = 1; i <= numUsers && assignmentsMade < openListings.size(); i++) {
        int randomIndex = rnd.nextInt(openListings.size());
        int picked = openListings.get(randomIndex);
        
        if (this.listToAuthor.get(picked - 1) == i) {
            continue;
        }
        
        this.listingToUser.put(picked, i);
        listAssigns.add(new Object[] {picked, i});
        
        openListings.remove(randomIndex);
        assignmentsMade++;
    }

    if (listAssigns.isEmpty()) {
        System.out.println("Warning: No assignments could be made");
        return;
    }

    String sql = "INSERT INTO AssignedTo VALUES(?, ?)";
    this.jdbc.batchUpdate(sql, listAssigns);
    
    System.out.println("Created " + assignmentsMade + " listing assignments");
  }

  public void updateListings() {
    Random rnd = new Random();
    String[] STATUSES = {
        "open",
        "taken", 
        "completed",
        "cancelled"
    };
    
    List<Object[]> listUpdates = new ArrayList<>();
    int completedCount = 0;
    
    // Only update listings that are assigned to a user
    for (int listid : listingToUser.keySet()) {
        int index = rnd.nextInt(3) + 1; // Skip "open" status (index 0) since we're updating
        if (index == 2) { // "completed"
            this.completedTasks.add(listid);
            completedCount++;
        }
        String status = STATUSES[index];
        listUpdates.add(new Object[]{status, listid});
    }
    
    System.out.println("Marking " + completedCount + " listings as completed");
    
    if (!listUpdates.isEmpty()) {
        String sql = "UPDATE Listings SET status = ? WHERE listid = ?";
        this.jdbc.batchUpdate(sql, listUpdates);
        System.out.println("Updated " + listUpdates.size() + " listing statuses");
    } else {
        System.out.println("No listings to update");
    }
  }
}
