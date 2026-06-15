package be.backend.services.impl;

import be.backend.services.CloudinaryService;
import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;
    
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );
    
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @Override
    public Map<String, String> uploadImage(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (!isValidImage(file)) {
            throw new IllegalArgumentException("Invalid image file. Only JPG, PNG, GIF, WEBP allowed");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 5MB limit");
        }

        try {
            // Upload parameters
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image",
                    "transformation", new Transformation()
                            .width(500)
                            .height(500)
                            .crop("fill")
                            .gravity("face")
                            .quality("auto:good")
                            .fetchFormat("auto")
            );

            // Upload to Cloudinary
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);

            // Extract URL and public_id
            Map<String, String> result = new HashMap<>();
            result.put("url", (String) uploadResult.get("secure_url"));
            result.put("public_id", (String) uploadResult.get("public_id"));

            log.info("Image uploaded successfully: {}", result.get("public_id"));
            return result;

        } catch (IOException e) {
            log.error("Failed to upload image to Cloudinary", e);
            throw new IOException("Failed to upload image: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteImage(String publicId) throws IOException {
        if (publicId == null || publicId.isEmpty()) {
            log.warn("Attempted to delete image with empty public_id");
            return;
        }

        try {
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            String deleteResult = (String) result.get("result");

            if ("ok".equals(deleteResult)) {
                log.info("Image deleted successfully: {}", publicId);
            } else {
                log.warn("Image deletion returned status: {} for public_id: {}", deleteResult, publicId);
            }

        } catch (IOException e) {
            log.error("Failed to delete image from Cloudinary: {}", publicId, e);
            throw new IOException("Failed to delete image: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean isValidImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            log.warn("Invalid content type: {}", contentType);
            return false;
        }

        // Check if file has valid extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            return false;
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        List<String> allowedExtensions = Arrays.asList("jpg", "jpeg", "png", "gif", "webp");

        return allowedExtensions.contains(extension);
    }
}
