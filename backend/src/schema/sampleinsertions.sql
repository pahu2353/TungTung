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
        poster_uid,
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
        3,
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
        2,
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
