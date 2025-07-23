package com.tungtung.hello;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class Hasher {
  public static String hashPassword(String password) throws NoSuchAlgorithmException {
    MessageDigest md = MessageDigest.getInstance("SHA-256");
    byte[] hashBytes = md.digest(password.getBytes());

    // Convert bytes to hex
    StringBuilder hexString = new StringBuilder();
    for (byte b : hashBytes) {
        String hex = String.format("%02x", b);
        hexString.append(hex);
    }

    return hexString.toString();
  }
}
