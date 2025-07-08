package com.tungtung.hello;

import java.util.ArrayList;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;

import com.github.javafaker.Faker;

public class Seed {
  private final JdbcTemplate jdbc;
  private List<Object[]> userList;

  public Seed(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
    this.userList = new ArrayList<>();
  }

  public void clearDb() {
    String sql = """
        DELETE FROM Accounts
        """;
  }

  public void createAccountsBatch() {
    String sql = """
      INSERT INTO Accounts
        (name, profile_picture, phone_number, email)
      VALUES (?, ?, ?, ?)
      """;
    Faker faker = new Faker();

    for (int i = 0; i < 50; i++) {
        String name  = faker.name().firstName() + " " + faker.name().lastName();
        String pfp   = faker.internet().avatar();
        String phone = faker.phoneNumber().phoneNumber();
        String email = faker.internet().emailAddress();

        this.userList.add(new Object[]{ name, pfp, phone, email });
    }

    jdbc.batchUpdate(sql, this.userList);
  }

  public void createCategories() {

  }

  public void createReviews() {

  }

  public void createListings() {
    
  }
}
