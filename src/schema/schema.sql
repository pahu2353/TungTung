CREATE TABLE Accounts (
  uid INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  profile_picture TEXT,
  phone_number VARCHAR(100),
  email VARCHAR(100),
  overall_rating FLOAT DEFAULT NULL
);

CREATE TABLE TaskCategories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE Listings (
  listid INT AUTO_INCREMENT PRIMARY KEY,
  listing_name VARCHAR(100) NOT NULL,
  description TEXT,
  poster_uid INT NOT NULL,
  capacity INT DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  duration INT NOT NULL,
  address VARCHAR(255) NOT NULL,  
  longitude DECIMAL(9,6) NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  posting_time TIMESTAMP NOT NULL,
  deadline TIMESTAMP,
  status ENUM('open', 'taken', 'completed', 'cancelled'),
  FOREIGN KEY (poster_uid) REFERENCES Accounts(uid)
);

CREATE TABLE ListingCategory (
  listid INT,
  category_id INT,
  PRIMARY KEY (listid, category_id),
  FOREIGN KEY (listid) REFERENCES Listings(listid),
  FOREIGN KEY (category_id) REFERENCES TaskCategories(category_id)
);

CREATE TABLE AccountInterestCategories (
  uid INT,
  category_id INT,
  PRIMARY KEY (uid, category_id),
  FOREIGN KEY (uid) REFERENCES Accounts(uid),
  FOREIGN KEY (category_id) REFERENCES TaskCategories(category_id)
);

CREATE TABLE ListingAssignment (
  listid INT,
  uid INT,
  PRIMARY KEY (listid, uid),
  FOREIGN KEY (listid) REFERENCES Listings(listid),
  FOREIGN KEY (uid) REFERENCES Accounts(uid)
);

CREATE TABLE Reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  listid INT,
  reviewer_uid INT,
  reviewee_uid INT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  timestamp TIMESTAMP,
  FOREIGN KEY (listid) REFERENCES Listings(listid),
  FOREIGN KEY (reviewer_uid) REFERENCES Accounts(uid),
  FOREIGN KEY (reviewee_uid) REFERENCES Accounts(uid)
);
