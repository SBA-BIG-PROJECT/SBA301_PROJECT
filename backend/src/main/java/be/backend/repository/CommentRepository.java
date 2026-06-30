package be.backend.repository;

import be.backend.entity.Comment;
import be.backend.entity.Movie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Integer> {


    @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.id = :id")
    Optional<Comment> findByIdWithUser(@Param("id") Integer id);


    @Query(value = "SELECT c FROM Comment c JOIN FETCH c.user " +
            "WHERE c.tmdb = :movie AND c.parentComment IS NULL",
            countQuery = "SELECT COUNT(c) FROM Comment c " +
                    "WHERE c.tmdb = :movie AND c.parentComment IS NULL")
    Page<Comment> findRootComments(@Param("movie") Movie movie, Pageable pageable);


    @Query(value = "SELECT c FROM Comment c JOIN FETCH c.user WHERE c.parentComment = :parent",
            countQuery = "SELECT COUNT(c) FROM Comment c WHERE c.parentComment = :parent")
    Page<Comment> findReplies(@Param("parent") Comment parent, Pageable pageable);


    @Query("SELECT c.parentComment.id AS parentId, COUNT(c) AS total FROM Comment c " +
            "WHERE c.parentComment.id IN :parentIds AND c.isDeleted = false " +
            "GROUP BY c.parentComment.id")
    List<ReplyCount> countRepliesByParentIds(@Param("parentIds") Collection<Integer> parentIds);

    interface ReplyCount {
        Integer getParentId();
        long getTotal();
    }
}