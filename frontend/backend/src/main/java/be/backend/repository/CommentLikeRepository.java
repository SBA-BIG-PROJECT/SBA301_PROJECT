package be.backend.repository;

import be.backend.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CommentLikeRepository extends JpaRepository<CommentLike, Integer> {


    boolean existsByComment_IdAndUser_Id(Integer commentId, Integer userId);

    void deleteByComment_IdAndUser_Id(Integer commentId, Integer userId);

    List<CommentLike> findByUser_IdAndComment_IdIn(Integer userId, Collection<Integer> commentIds);
}