CREATE TABLE Users (
  uid INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  profile_picture TEXT,
  phone_number VARCHAR(100),
  email VARCHAR(100),
  password VARCHAR(100) NOT NULL,
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
  INDEX idx_belongsto_category (category_id),
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

-- new table for managing which users posted which listings
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
