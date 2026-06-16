package be.backend.enums;

/**
 * User roles in the system
 * USER: Regular user with basic access (replaces VIEWER)
 * ADMIN: Administrator with full access to admin panel
 */
public enum UserRole {
    USER("USER"),
    ADMIN("ADMIN");

    private final String value;

    UserRole(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static UserRole fromString(String value) {
        for (UserRole role : UserRole.values()) {
            if (role.value.equalsIgnoreCase(value)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Invalid role: " + value + ". Valid roles are: USER, ADMIN");
    }
    
    public static boolean isValidRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            return false;
        }
        try {
            fromString(role);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
