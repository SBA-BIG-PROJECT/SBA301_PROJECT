package be.backend.exception;

public class DuplicateWatchlistException extends RuntimeException {
    public DuplicateWatchlistException(String message) {
        super(message);
    }
}
