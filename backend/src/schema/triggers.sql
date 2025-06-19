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
BEFORE INSERT ON ListingAssignment
FOR EACH ROW
BEGIN
  DECLARE listing_owner INT;

  SELECT poster_uid INTO listing_owner
  FROM Listings
  WHERE listid = NEW.listid;

  IF listing_owner = NEW.uid THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'User cannot assign themselves to their own listing';
  END IF;
END$$

-- prevent assignment to closed/taken listings
CREATE TRIGGER trg_prevent_taken_or_closed
BEFORE INSERT ON ListingAssignment
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
  FROM ListingAssignment
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
AFTER INSERT ON ListingAssignment
FOR EACH ROW
BEGIN
  DECLARE current_assignments INT;
  DECLARE max_capacity INT;

  SELECT COUNT(*) INTO current_assignments
  FROM ListingAssignment
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

  UPDATE Accounts
  SET overall_rating = avg_rating
  WHERE uid = NEW.reviewee_uid;
END$$


DELIMITER ;
