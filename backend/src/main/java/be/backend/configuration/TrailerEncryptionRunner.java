package be.backend.configuration;

import be.backend.entity.Movie;
import be.backend.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Chạy MỘT LẦN để mã hóa các trailer_url cũ đang lưu plaintext.
 * Sau khi thấy log "Encrypted N trailer URLs", XÓA file này (hoặc bỏ @Component) rồi build lại.
 * An toàn khi chạy lại nhiều lần: link đã mã hóa sẽ được bỏ qua.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TrailerEncryptionRunner implements CommandLineRunner {

    private final MovieRepository movieRepository;
    private final CryptoConfig crypto;

    @Override
    @Transactional
    public void run(String... args) {
        List<Movie> all = movieRepository.findAll();
        int encrypted = 0;
        int skipped = 0;

        for (Movie movie : all) {
            String url = movie.getTrailerUrl();
            if (url == null || url.isBlank()) {
                continue;
            }

            if (isAlreadyEncrypted(url)) {
                skipped++;
                continue;
            }

            movie.setTrailerUrl(crypto.encrypt(url));
            encrypted++;
        }

        movieRepository.saveAll(all);
        log.info("TrailerEncryptionRunner done. Encrypted {} trailer URLs, skipped {} already-encrypted.",
                encrypted, skipped);
    }

    /** Nếu decrypt thành công thì url đã là ciphertext hợp lệ -> bỏ qua. */
    private boolean isAlreadyEncrypted(String url) {
        try {
            crypto.decrypt(url);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}