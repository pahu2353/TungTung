DROP DATABASE IF EXISTS TungTung;
CREATE DATABASE TungTung;
USE TungTung;

CREATE TABLE Users (
  uid INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  profile_picture TEXT,
  phone_number VARCHAR(100),
  email VARCHAR(100),
  overall_rating FLOAT DEFAULT NULL,
  CONSTRAINT check_contact CHECK (phone_number IS NOT NULL OR email IS NOT NULL),
  CONSTRAINT check_overall_rating CHECK (overall_rating IS NULL OR (overall_rating >= 1.0 AND overall_rating <= 5.0)),
  INDEX idx_users_email         (email),
  INDEX idx_users_phone_number  (phone_number)
);

CREATE TABLE TaskCategories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE Listings (
  listid INT AUTO_INCREMENT PRIMARY KEY,
  listing_name VARCHAR(100) NOT NULL,
  description TEXT,
  capacity INT DEFAULT 1 CHECK (capacity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  duration INT NOT NULL CHECK (duration > 0),
  address VARCHAR(255) NOT NULL,  
  longitude DECIMAL(9,6) NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  posting_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deadline TIMESTAMP,
  status ENUM('open', 'taken', 'completed', 'cancelled')
);

CREATE TABLE BelongsTo (
  listid INT,
  category_id INT,
  PRIMARY KEY (listid, category_id),
  FOREIGN KEY (listid) REFERENCES Listings(listid),
  FOREIGN KEY (category_id) REFERENCES TaskCategories(category_id)
);

CREATE TABLE InterestedIn (
  uid INT,
  category_id INT,
  PRIMARY KEY (uid, category_id),
  FOREIGN KEY (uid) REFERENCES Users(uid),
  FOREIGN KEY (category_id) REFERENCES TaskCategories(category_id)
);

CREATE TABLE AssignedTo (
  listid INT,
  uid INT,
  PRIMARY KEY (listid, uid),
  FOREIGN KEY (listid) REFERENCES Listings(listid),
  FOREIGN KEY (uid) REFERENCES Users(uid)
);

CREATE TABLE Posts (
  listid INT,
  uid INT,
  PRIMARY KEY (listid, uid),
  FOREIGN KEY (listid) REFERENCES Listings(listid),
  FOREIGN KEY (uid) REFERENCES Users(uid)
);

CREATE TABLE Reviews (
  listid INT,
  reviewer_uid INT,
  reviewee_uid INT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listid) REFERENCES Listings(listid),
  FOREIGN KEY (reviewer_uid) REFERENCES Users(uid),
  FOREIGN KEY (reviewee_uid) REFERENCES Users(uid),
  -- Composite primary key to ensure unique reviews per listing and user pair (review_id removed)
  PRIMARY KEY (listid, reviewer_uid, reviewee_uid), 
  CONSTRAINT check_no_self_review CHECK (reviewer_uid != reviewee_uid),
  UNIQUE unique_review(listid, reviewer_uid, reviewee_uid)
);

DELIMITER $$

-- enforce deadline >= posting_time + duration
CREATE TRIGGER check_deadline_trigger
BEFORE INSERT ON Listings
FOR EACH ROW
BEGIN
  IF NEW.deadline <= DATE_ADD(NEW.posting_time, INTERVAL NEW.duration MINUTE) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Deadline must be after posting_time + duration';
  END IF;
END$$

CREATE TRIGGER check_deadline_trigger_update
BEFORE UPDATE ON Listings
FOR EACH ROW
BEGIN
  IF NEW.deadline <= DATE_ADD(NEW.posting_time, INTERVAL NEW.duration MINUTE) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Deadline must be after posting_time + duration';
  END IF;
END$$


-- prevent self-assignment
CREATE TRIGGER trg_prevent_self_assignment
BEFORE INSERT ON AssignedTo
FOR EACH ROW
BEGIN
  DECLARE listing_owner INT;

  SELECT uid INTO listing_owner
  FROM Posts
  WHERE listid = NEW.listid;

  IF listing_owner = NEW.uid THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'User cannot assign themselves to their own listing';
  END IF;
END$$

-- prevent assignment to closed/taken listings
CREATE TRIGGER trg_prevent_taken_or_closed
BEFORE INSERT ON AssignedTo
FOR EACH ROW
BEGIN
  DECLARE listing_status ENUM('open', 'taken', 'completed', 'cancelled');

  SELECT status INTO listing_status
  FROM Listings
  WHERE listid = NEW.listid;

  IF listing_status != 'open' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Listing is not open for assignment';
  END IF;
END$$

-- only assigned users can leave reviews
CREATE TRIGGER trg_enforce_assigned_reviewer
BEFORE INSERT ON Reviews
FOR EACH ROW
BEGIN
  DECLARE is_assigned INT;

  SELECT COUNT(*) INTO is_assigned
  FROM AssignedTo
  WHERE listid = NEW.listid AND uid = NEW.reviewer_uid;

  IF is_assigned = 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Only assigned users can leave reviews';
  END IF;
END$$

-- prevent review unless listing is completed
CREATE TRIGGER trg_check_listing_completed
BEFORE INSERT ON Reviews
FOR EACH ROW
BEGIN
  DECLARE listing_status ENUM('open', 'taken', 'completed', 'cancelled');

  SELECT status INTO listing_status
  FROM Listings
  WHERE listid = NEW.listid;

  IF listing_status != 'completed' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Only completed listings can be reviewed';
  END IF;
END$$

-- update listing status to 'taken' when capacity is reached
CREATE TRIGGER trg_listing_status_taken
AFTER INSERT ON AssignedTo
FOR EACH ROW
BEGIN
  DECLARE current_assignments INT;
  DECLARE max_capacity INT;

  SELECT COUNT(*) INTO current_assignments
  FROM AssignedTo
  WHERE listid = NEW.listid;

  SELECT capacity INTO max_capacity
  FROM Listings
  WHERE listid = NEW.listid;

  IF current_assignments >= max_capacity THEN
    UPDATE Listings
    SET status = 'taken'
    WHERE listid = NEW.listid AND status = 'open';
  END IF;
END$$

-- update overall_rating after inserting a review
CREATE TRIGGER trg_update_overall_rating
AFTER INSERT ON Reviews
FOR EACH ROW
BEGIN
  DECLARE avg_rating FLOAT;

  SELECT AVG(rating) INTO avg_rating
  FROM Reviews
  WHERE reviewee_uid = NEW.reviewee_uid;

  UPDATE Users
  SET overall_rating = avg_rating
  WHERE uid = NEW.reviewee_uid;
END$$


DELIMITER ;

INSERT INTO
    Users (name, profile_picture, phone_number, email)
VALUES
    (
        'Alice Green',
        NULL,
        '416-555-1234',
        'alice@example.com'
    ),
    (
        'Bob Smith',
        NULL,
        '647-555-2345',
        'bob@example.com'
    ),
    ('Charlie Lee', NULL, NULL, 'charlie@example.com'),
    ('Daisy Patel', NULL, '647-555-3456', NULL),
    ('Evan Wong', NULL, NULL, 'evan@example.com');

INSERT INTO
    TaskCategories (category_name)
VALUES
    ('Gardening'),
    ('Tutoring'),
    ('Plumbing'),
    ('Moving'),
    ('Cleaning');

INSERT INTO
    Listings (
        listing_name,
        description,
        capacity,
        price,
        duration,
        address,
        longitude,
        latitude,
        posting_time,
        deadline,
        status
    )
VALUES
    (
        'Backyard Gardening Assistance',
        'I need someone to help me with trimming hedges and de-weeding.',
        1,
        25.00,
        120,
        '123 Maple St, Toronto, ON',
        -79.3832,
        43.6532,
        '2025-06-18 09:00:00',
        '2025-06-18 12:00:00',
        'open'
    ),
    (
        'Math Tutoring Session',
        'I am one of the worst math students in all of Toronto, having averaged 35% as a student at the University of Waterloo. I need LOTS of help with algebra and calculus.',
        2,
        40.00,
        90,
        '456 Elm St, Toronto, ON',
        -79.3820,
        43.6540,
        '2025-06-18 14:00:00',
        '2025-06-18 16:30:00',
        'open'
    ),
    (
        'General Plumbing',
        'My shower is leaking and I have put a bucket underneath it. Would appreciate some help!',
        1,
        60.00,
        60,
        '789 Oak Ave, Toronto, ON',
        -79.3810,
        43.6525,
        '2025-06-17 10:00:00',
        '2025-06-17 11:30:00',
        'open'
    );

INSERT INTO Posts (listid, uid) VALUES (1, 1), (2, 3), (3, 2);

INSERT INTO
    BelongsTo (listid, category_id)
VALUES
    (1, 1),
    (2, 2),
    (3, 3);

INSERT INTO
    InterestedIn (uid, category_id)
VALUES
    (2, 1),
    (2, 2),
    (4, 2),
    (4, 5),
    (5, 4),
    (5, 5);

INSERT INTO
    AssignedTo (listid, uid)
VALUES
    (1, 2),
    (2, 4),
    (2, 5),
    (3, 4);

UPDATE Listings
SET
    status = 'completed'
WHERE
    listid = 3;

INSERT INTO
    Reviews (
        listid,
        reviewer_uid,
        reviewee_uid,
        rating,
        comment
    )
VALUES
    (
        3,
        4,
        2,
        5,
        'Fantastic work... fixed every leak in my house in 30 minutes.'
    );
