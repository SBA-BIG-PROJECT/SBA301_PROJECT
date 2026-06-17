package be.backend.services;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

public interface CloudinaryService {
    
    /**
     * Upload image to Cloudinary
     * @param file image file
     * @param folder folder path in Cloudinary
     * @return Map with url and public_id
     * @throws IOException if upload fails
     */
    Map<String, String> uploadImage(MultipartFile file, String folder) throws IOException;
    
    /**
     * Delete image from Cloudinary
     * @param publicId public id of image
     * @throws IOException if delete fails
     */
    void deleteImage(String publicId) throws IOException;
    
    /**
     * Validate if file is an image
     * @param file file to validate
     * @return true if valid image
     */
    boolean isValidImage(MultipartFile file);
}
