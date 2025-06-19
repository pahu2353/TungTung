# Welcome to `TungTung` (formerly `spootify`)
Like Uber, but for services — use our website to call a plumber to fix your pipes, or a gardener to de-weed your garden!

## Sample Dataset
The dataset will be entirely populated by users. See below for how to populate the `Accounts` table with our sample dataset.

## Dependencies
- Java 17 SDK

On VSCode:
- Java Extension Pack
- Spring Boot Extension Pack

## Installation Instructions
In the future, this app will be dockerized for a streamlined experience. For now, we will use manual configuration.

First, install the dependecies above. Then, clone the repo:
```
git clone https://github.com/pahu2353/spootify.git
cd spootify
```

Then, create the sample database and tables:
```

CREATE DATABASE IF NOT EXISTS TungTung;
USE TungTung;

CREATE TABLE Account (
  uid              INT         PRIMARY KEY,
  name             VARCHAR(100),
  profile_picture  TEXT,
  contact_info     VARCHAR(100),
  overall_rating   FLOAT       DEFAULT NULL
);

INSERT INTO `Account`
  (`uid`, `name`, `profile_picture`,                       `contact_info`,         `overall_rating`)
VALUES
  (1,    'Alice Smith',   'https://example.com/profiles/alice.jpg',   'alice@example.com',   4.5),
  (2,    'Bob Johnson',   'https://example.com/profiles/bob.jpg',     'bob@example.com',     3.8),
  (3,    'Charlie Davis', NULL,                                    'charlie@example.com', NULL),
  (4,    'Diana Evans',   'https://example.com/profiles/diana.jpg',  'diana@example.com',   4.9),
  (5,    'Ethan Wilson',  NULL,                                    'ethan@example.com',   4.2),
  (6,    'Fiona Garcia',  'https://example.com/profiles/fiona.jpg',  'fiona@example.com',   4.0);
```

Configure credentials in `src/main/resources/application.properties` as follows:
```
spring.application.name=TungTung
spring.datasource.url=jdbc:mysql://localhost:3306/TungTung?useSSL=false&serverTimezone=UTC
spring.datasource.username=[YOUR_USERNAME]
spring.datasource.password=[YOUR_PASSWORD]
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

Lastly, run `./mvnw clean spring-boot:run`. Two endpoints should be accessible:

```
localhost:8080/hello
localhost:8080/accounts
```
