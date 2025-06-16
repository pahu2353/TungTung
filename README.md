# Welcome to `spootify`
Relive memories and discover new artists.

## Sample Dataset
The sample dataset is from Spotify's `Extended Streaming History`, which can be requested by Spotify users from https://www.spotify.com/ca-en/account/privacy/.

## Sample Database
We created a sample database (`spootify.sql`) with the following commands:

```
mysql -u root -p
```

```
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Then, the schema and data can be exported with `mysqldump -u root -p spootify > spootify.sql`.

## Using the Sample Database
After cloning from GitHub, run `mysql -u root -p < spootify.sql` to locally load the database.


