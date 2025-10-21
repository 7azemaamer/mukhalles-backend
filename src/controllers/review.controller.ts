import { Request, Response } from "express";
import mongoose from "mongoose";
import { Review, Office } from "../models";
import { AuthRequest } from "../types";
import logger from "../utils/logger";

export const getOfficeReviews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 20,
      rating,
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = { officeId: id, isApproved: true };
    if (rating) query.rating = parseInt(rating as string);

    const sortOptions: any = {};
    if (sortBy === "created_at")
      sortOptions.createdAt = sortOrder === "asc" ? 1 : -1;
    if (sortBy === "rating") sortOptions.rating = sortOrder === "asc" ? 1 : -1;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate(
          "userId",
          "individualProfile.fullName individualProfile.avatarUrl"
        )
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error("Get office reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get reviews",
    });
  }
};

export const createReview = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { rating, text, serviceTag } = req.body;

    if (!rating || !text) {
      return res.status(400).json({
        success: false,
        message: "Rating and text are required",
      });
    }

    const existingReview = await Review.findOne({
      officeId: id,
      userId: req.user?.userId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this office",
      });
    }

    const review = await Review.create({
      officeId: id,
      userId: req.user?.userId,
      rating,
      text,
      serviceTag,
      likes: [],
      likesCount: 0,
      isApproved: true,
    });

    const reviews = await Review.find({ officeId: id, isApproved: true });
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Office.findByIdAndUpdate(id, {
      rating: avgRating,
      ratingCount: reviews.length,
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (error) {
    logger.error("Create review error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create review",
    });
  }
};

export const updateReview = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { rating, text, serviceTag } = req.body;

    const review = await Review.findOne({ _id: id, userId: req.user?.userId });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (rating !== undefined) review.rating = rating;
    if (text !== undefined) review.text = text;
    if (serviceTag !== undefined) review.serviceTag = serviceTag;

    await review.save();

    const reviews = await Review.find({
      officeId: review.officeId,
      isApproved: true,
    });
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Office.findByIdAndUpdate(review.officeId, {
      rating: avgRating,
      ratingCount: reviews.length,
    });

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  } catch (error) {
    logger.error("Update review error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update review",
    });
  }
};

export const deleteReview = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const review = await Review.findOne({ _id: id, userId: req.user?.userId });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const officeId = review.officeId;
    await Review.findByIdAndDelete(id);

    const reviews = await Review.find({ officeId, isApproved: true });
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    await Office.findByIdAndUpdate(officeId, {
      rating: avgRating,
      ratingCount: reviews.length,
    });

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    logger.error("Delete review error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
};

export const likeReview = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const likeIndex = review.likes.findIndex(
      (like) => like.userId.toString() === userId.toString()
    );

    if (likeIndex > -1) {
      review.likes.splice(likeIndex, 1);
      review.likesCount = review.likes.length;
      await review.save();

      return res.status(200).json({
        success: true,
        isLiked: false,
        likesCount: review.likesCount,
      });
    }

    review.likes.push({ userId, createdAt: new Date() });
    review.likesCount = review.likes.length;
    await review.save();

    return res.status(200).json({
      success: true,
      isLiked: true,
      likesCount: review.likesCount,
    });
  } catch (error) {
    logger.error("Like review error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to like review",
    });
  }
};

export const getUserReviews = async (req: AuthRequest, res: Response) => {
  try {
    const reviews = await Review.find({ userId: req.user?.userId })
      .populate("officeId", "name city avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    logger.error("Get user reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get reviews",
    });
  }
};
