package com.aiprompt2draw.utils;

import cn.hutool.crypto.digest.BCrypt;
import java.util.Scanner;

/**
 * Password encoder utility class
 * Used to generate BCrypt encrypted passwords for database initialization and password reset
 */
public class PasswordEncoder {

    /**
     * Encode plain password
     * @param plainPassword plain text password
     * @return BCrypt encrypted password
     */
    public static String encodePassword(String plainPassword) {
        return BCrypt.hashpw(plainPassword, BCrypt.gensalt());
    }

    /**
     * Verify password
     * @param plainPassword plain text password
     * @param hashedPassword encrypted password
     * @return if matches
     */
    public static boolean checkPassword(String plainPassword, String hashedPassword) {
        return BCrypt.checkpw(plainPassword, hashedPassword);
    }

    /**
     * Main function - interactive password encryption tool
     */
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.println("=== AIPrompt2Draw Password Encoder Tool ===");
        System.out.println("Used to generate BCrypt encrypted passwords");
        System.out.println();

        while (true) {
            System.out.print("Enter plain password (type 'exit' to quit): ");
            String plainPassword = scanner.nextLine().trim();

            if ("exit".equalsIgnoreCase(plainPassword)) {
                System.out.println("Goodbye!");
                break;
            }

            if (plainPassword.isEmpty()) {
                System.out.println("Password cannot be empty, please re-enter.");
                continue;
            }

            // Generate encrypted password
            String hashedPassword = encodePassword(plainPassword);

            System.out.println();
            System.out.println("Plain password: " + plainPassword);
            System.out.println("Encrypted password: " + hashedPassword);
            System.out.println();

            // Verify encryption result
            boolean isValid = checkPassword(plainPassword, hashedPassword);
            System.out.println("Verification result: " + (isValid ? "SUCCESS - Verification passed" : "FAILED - Verification error"));
            System.out.println();

            // SQL update statement example
            System.out.println("SQL update statement example:");
            System.out.println("UPDATE admin_user SET password = '" + hashedPassword + "' WHERE username = 'admin';");
            System.out.println();

            System.out.println("---");
            System.out.println();
        }

        scanner.close();
    }
}