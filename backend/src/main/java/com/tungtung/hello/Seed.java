package com.tungtung.hello;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

import org.springframework.jdbc.core.JdbcTemplate;

import com.github.javafaker.Faker;

public class Seed {
  private final JdbcTemplate jdbc;
  private Faker faker;

  public Seed(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
    this.faker = new Faker();
  }

  public void clearDb() {
    jdbc.execute("SET FOREIGN_KEY_CHECKS = 0");
    
    jdbc.batchUpdate(
      "TRUNCATE TABLE Users",
      "TRUNCATE TABLE Reviews",
      "TRUNCATE TABLE AssignedTo",
      "TRUNCATE TABLE InterestedIn",
      "TRUNCATE TABLE BelongsTo",
      "TRUNCATE TABLE Listings",
      "TRUNCATE TABLE TaskCategories"
    );
    
    jdbc.execute("SET FOREIGN_KEY_CHECKS = 1");
}


  public void createAccountsBatch() {
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

    jdbc.batchUpdate(sql, userList);
  }

  public void createListings() {
    int postingId = 1;
    Random rnd = new Random();
    for (int id = 1; id <= 50; id++) {
      int postings = rnd.nextInt(6);
      for (int posting = 0; posting < postings; posting++, postingId++) {
        // make posting for user 'id'

        // pick categories for each posting
        int categories = rnd.nextInt(4);  // 0–3 distinct picks

        List<Integer> pool = new ArrayList<>();
        for (int i = 1; i <= 10; i++) pool.add(i);

        Collections.shuffle(pool, rnd);

        for (int i = 0; i < categories; i++) {
          int pick = pool.get(i);
        }
      }
    }
  }

  public void createCategories() {
    String sql = "INSERT INTO TaskCategories(category_name) VALUES(?)";
    List<Object[]> genreList = new ArrayList<>();
    for (int i = 0; i < 10; i++) {
      String category = this.faker.music().genre();

      genreList.add(new Object[]{category});
    }

    jdbc.batchUpdate(sql, genreList);
  }

  public void createReviews() {

  }
}
