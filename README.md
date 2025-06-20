# Welcome to `TungTung` (formerly `spootify`)
Like Uber, but for services — use our website to make a post asking for a plumber to fix your pipes, a gardener to de-weed your garden, or a math tutor to help you with your midterm prep!

## Sample Dataset
The dataset will be entirely populated by users. See below for how to set up the database with our sample dataset.

## Dependencies
- Java 17 SDK
- Next.js 15.3
- MySQL

On VSCode:
- Java Extension Pack
- Spring Boot Extension Pack

## Installation Instructions
In the future, this app will be dockerized for a streamlined experience. For now, we will use manual configuration.

First, install the dependecies above. Then, clone the repo:
```
git clone https://github.com/pahu2353/tungtung.git
cd TungTung
```

## Initializing Backend

First, `cd backend`. Then, create the sample database and tables by running `sample-dataset.sql` in `backend/src/schema`

Configure credentials in `backend/src/main/resources/application.properties` as follows:
```
spring.application.name=TungTung
spring.datasource.url=jdbc:mysql://localhost:3306/TungTung?useSSL=false&serverTimezone=UTC
spring.datasource.username=[YOUR_USERNAME]
spring.datasource.password=[YOUR_PASSWORD]
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

Lastly, run `./mvnw clean spring-boot:run` in backend. These endpoints should be accessible:

```
localhost:8080/hello
localhost:8080/taskcategories
localhost:8080/listings
localhost:8080/listings/{listingId}/reviews
localhost:8080/accounts/{uid}/name
```

## Initializing Frontend

Steps:

1. `cd frontend`
2. `npm install`
3. `npm run dev`

After this `localhost:3000` should open on your browser.

NOTE: Please make sure that the backend is running before running the frontend.
