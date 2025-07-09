package com.tungtung.hello;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

import org.springframework.jdbc.core.JdbcTemplate;

import com.github.javafaker.Faker;
import com.github.javafaker.Address;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

public class Seed {
  private final JdbcTemplate jdbc;
  private Faker faker;

  public Seed(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
    this.faker = new Faker();
  }

  public void populate() {
    this.clearDb();
    this.createAccounts();
    this.createCategories();
    this.createListings();
    this.createReviews();
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

    for (int i = 0; i < 50; i++) {
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
    for (int id = 1; id <= 50; id++) {
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

        // pick categories for each posting
        int categories = rnd.nextInt(4);  // 0–3 distinct picks

        List<Integer> pool = new ArrayList<>();
        for (int i = 1; i <= 10; i++) pool.add(i);

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
  }

  public void createCategories() {
    String sql = "INSERT INTO TaskCategories(category_name) VALUES(?)";
    
    Set<String> uniqueCategories = new LinkedHashSet<>();
    while (uniqueCategories.size() < 10) {
      uniqueCategories.add(this.faker.leagueOfLegends().champion());
    }
    
    List<Object[]> batchArgs = uniqueCategories.stream()
        .map(name -> new Object[]{ name })
        .collect(Collectors.toList());
    
    this.jdbc.batchUpdate(sql, batchArgs);
  }

  public void createReviews() {

  }
}
