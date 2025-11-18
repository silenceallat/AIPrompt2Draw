package com.aiprompt2draw.utils;

/**
 * Simple password encoding test
 */
public class PasswordTest {
    public static void main(String[] args) {
        String plainPassword = "admin123";
        String hashedPassword = PasswordEncoder.encodePassword(plainPassword);

        System.out.println("Plain password: " + plainPassword);
        System.out.println("Hashed password: " + hashedPassword);

        boolean isValid = PasswordEncoder.checkPassword(plainPassword, hashedPassword);
        System.out.println("Verification: " + (isValid ? "SUCCESS" : "FAILED"));

        System.out.println("\nSQL update statement:");
        System.out.println("UPDATE admin_user SET password = '" + hashedPassword + "' WHERE username = 'admin';");
    }
}
