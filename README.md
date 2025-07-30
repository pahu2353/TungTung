# Welcome to `TungTung`
Like Uber, but for services — use our website to make a post asking for a plumber to fix your pipes, a gardener to de-weed your garden, or a math tutor to help you with your midterm prep!

<!-- ![image](https://github.com/user-attachments/assets/a7433faf-eac2-48ee-b30b-99489b020541) -->
![alt text](image.png)

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
GET  localhost:8080/hello
GET  localhost:8080/taskcategories
GET  localhost:8080/listings
GET  localhost:8080/listings/filter
GET  localhost:8080/listings/{listingId}/reviews
GET  localhost:8080/users/{uid}/name
GET  localhost:8080/db/seed

POST localhost:8080/signup
POST localhost:8080/login
```

## Accessing the Production Database

The production database has already been generated using JavaFaker to create realistic synthetic data, including user accounts, service listings, categories, assignments, and reviews. To load the production dataset into your database, simply run the following command:

```bash
mysql -u [YOUR_USERNAME] -p < backend/src/schema/production.sql
```

This scalable approach allows us to control the volume and complexity of the data by adjusting parameters, simulating diverse user behaviors and service demands.

## Initializing Frontend

Steps:

1. `cd frontend`
2. `npm install`
3. `npm run dev`

After this `localhost:3000` should open on your browser.

NOTE: Please make sure that the backend is running before running the frontend.


## Features Implemented

### Feature 1: Account Creation and Login
Users are able to create accounts and log in.

- **Backend**
  - File: `backend/src/main/java/com/tungtung/hello/M1Controller.java`
  - Endpoints:
    - `@PostMapping("/signup")`
    - `@PostMapping("/login")`
- **Frontend**
  - File: `frontend/app/page.tsx`
  - Functions:
    - `handleAuth`
    - `handleLogout`
    - `fetchUserName`

---

### Feature 2: Listing All Categories
Displays a list of all available service categories.

- **Backend**
  - File: `backend/src/main/java/com/tungtung/hello/M1Controller.java`
  - Endpoint:
    - `@GetMapping("/taskcategories")`
- **Frontend**
  - File: `frontend/app/page.tsx`
  - Function:
    - `handleGetTaskCategories`

---

### Feature 3: Category Filter for Listings
Users can click categories to filter the listings. Multiple category selections will display only listings that match **all** selected categories.

- **Backend**
  - File: `backend/src/main/java/com/tungtung/hello/M1Controller.java`
  - Endpoint:
    - `@GetMapping("/listings/filter")`
- **Frontend**
  - File: `frontend/app/page.tsx`
  - Function:
    - `toggleCategory`

---

### Feature 4: Taking a Listing (Assigning a User to a Task)
Users can assign and unassign themselves to tasks. Users cannot take non-open listings or assign themselves to their own listings.

- **Backend**
  - File: `backend/src/main/java/com/tungtung/hello/M1Controller.java`
  - Endpoints:
    - `@PostMapping("/listings/{listid}/assign/{uid}")`
    - `@PostMapping("/listings/{listid}/unassign/{uid}")`
- **Frontend**
  - File: `frontend/app/page.tsx`
  - Functions:
    - `handleAssign`
    - `handleUnassign`

---

### Feature 5: Adding a Review (1-5 stars + Comments)
After a task is marked as complete, the poster is prompted to review the fulfiller(s). If there are multiple fulfillers, the poster is prompted to review each one.

- **Backend**
  - File: `backend/src/main/java/com/tungtung/hello/M1Controller.java`
  - Endpoints:
    - `@PostMapping("/reviews")`
    - `@PostMapping("/listings/{listid}/complete")`
- **Frontend**
  - File: `frontend/app/profile/page.tsx`, `frontend/components/review-modal.tsx`
  - Functions:
    - `handleSubmitReview`
    - `handleMarkComplete`

---

### Advanced Feature 1: Update Status to “Taken” when Capacity is Reached (Trigger)
A database trigger ensures that listings are marked as "taken" when capacity is reached and prevents further assignments.

- **Backend**
  - File: `backend/src/schema/triggers.sql`
  - Trigger: `trg_listing_status_taken`
- **Frontend**
  - File: `frontend/app/page.tsx`
  - Function: (Handled automatically after assignment; no direct frontend code)

---

### Advanced Feature 2: Prevent Self-assignment (Trigger)
A database trigger prevents users from assigning themselves to their own tasks.

- **Backend**
  - File: `backend/src/schema/triggers.sql`
  - Trigger: `trg_prevent_self_assignment`
- **Frontend**
  - File: `frontend/app/page.tsx`
  - Function: (Handled by backend; error message shown on failure)

---

### Advanced Feature 3: Display a User’s Total Earnings
On the user profile page, users can see their lifetime total earnings from fulfilling tasks.

- **Backend**
  - File: `backend/src/main/java/com/tungtung/hello/M1Controller.java`
  - Endpoint:
    - `@GetMapping("/profile/{uid}")`
- **Frontend**
  - File: `frontend/app/profile/page.tsx`
  - Function:
    - Displayed in the profile summary section

---

### Advanced Feature 4: Simultaneous Transactions Lock
Row-level locking (`FOR UPDATE`) is used when assigning users to listings to prevent race conditions. Java Spring Boot is configured with isolation level SERIALIZABLE for maximum consistency.

- **Backend**
  - File: `backend/src/main/java/com/tungtung/hello/M1Controller.java`
  - Endpoints:
    - `@PostMapping("/listings/{listid}/assign/{uid}")`
    - `@PostMapping("/listings/{listid}/unassign/{uid}")`
  - Annotation: `@Transactional(isolation = Isolation.SERIALIZABLE)`
- **Frontend**
  - File: `frontend/app/page.tsx`
  - Function: (No direct code; handled by backend)

---

### Advanced Feature 5: Matching Algorithm to Sort Recommended Listings
Users can filter listings by “best match” to find the most suitable listings based on a weighted sum of category matches, distance from the user’s location, closest deadline, and price.

- **Backend**
  - File: `backend/src/main/java/com/tungtung/hello/M1Controller.java`
  - Endpoint:
    - `@GetMapping("/listings/filterAndSort")`
- **Frontend**
  - File: `frontend/app/page.tsx`
  - Functions:
    - `fetchFilteredSortedListings`
    - Sort option UI for "Best
