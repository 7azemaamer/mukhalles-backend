import { Request, Response } from "express";
import { User, Office, Review, AdminLog, Analytics } from "../models";
import { AuthRequest, VerificationStatus, AdminActionType, UserRole } from "../types";
import logger from "../utils/logger";

export const getDashboard = async (_req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalCompanies,
      totalOffices,
      pendingVerifications,
      totalReviews,
      activeToday,
    ] = await Promise.all([
      User.countDocuments({ role: "individual" }),
      User.countDocuments({ role: "company" }),
      Office.countDocuments(),
      User.countDocuments({ "companyProfile.verificationStatus": "pending" }),
      Review.countDocuments(),
      Analytics.countDocuments({
        metric: "office_views",
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    const topOffices = await Office.find()
      .sort({ rating: -1, ratingCount: -1 })
      .limit(10)
      .lean();

    const recentActivities = await AdminLog.find()
      .populate("adminId", "phone individualProfile.fullName")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalCompanies,
          totalOffices,
          pendingVerifications,
          totalReviews,
          activeToday,
        },
        recentActivities,
        topOffices,
      },
    });
  } catch (error) {
    logger.error("Get dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard data",
    });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (role) query.role = role;
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (status === "pending")
      query["companyProfile.verificationStatus"] = "pending";
    if (search) {
      query.$or = [
        { phone: { $regex: search, $options: "i" } },
        { "individualProfile.fullName": { $regex: search, $options: "i" } },
        { "companyProfile.nameAr": { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get users",
    });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-__v").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error("Get user by id error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get user",
    });
  }
};

export const updateUserStatus = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const oldStatus = user.isActive;
    user.isActive = isActive;
    await user.save();

    await AdminLog.create({
      adminId: req.user?.userId,
      action: AdminActionType.SUSPEND_USER,
      target: {
        type: "user",
        id: user._id,
      },
      details: {
        oldValues: { isActive: oldStatus },
        newValues: { isActive },
        reason,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(200).json({
      success: true,
      message: "User status updated successfully",
    });
  } catch (error) {
    logger.error("Update user status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

export const verifyCompany = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const user = await User.findById(id);

    if (!user || !user.companyProfile) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    user.companyProfile.verificationStatus = status as VerificationStatus;
    user.companyProfile.approvedBy = req.user?.userId as any;
    user.companyProfile.approvedAt = new Date();
    await user.save();

    if (status === "approved") {
      await Office.updateMany(
        { companyId: user._id },
        { isActive: true, verified: true }
      );
    }

    await AdminLog.create({
      adminId: req.user?.userId,
      action: AdminActionType.APPROVE_COMPANY,
      target: {
        type: "company",
        id: user._id,
      },
      details: {
        newValues: { verificationStatus: status },
        reason,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(200).json({
      success: true,
      message: "Company verification status updated successfully",
    });
  } catch (error) {
    logger.error("Verify company error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify company",
    });
  }
};

export const featureOffice = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { isFeatured, priority } = req.body;

    const office = await Office.findById(id);

    if (!office) {
      return res.status(404).json({
        success: false,
        message: "Office not found",
      });
    }

    office.isFeatured = isFeatured;
    if (priority !== undefined) office.featuredPriority = priority;
    await office.save();

    await AdminLog.create({
      adminId: req.user?.userId,
      action: AdminActionType.FEATURE_OFFICE,
      target: {
        type: "office",
        id: office._id,
      },
      details: {
        newValues: { isFeatured, priority },
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(200).json({
      success: true,
      message: "Office featured status updated successfully",
    });
  } catch (error) {
    logger.error("Feature office error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to feature office",
    });
  }
};

export const getReviewsForModeration = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, isApproved } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (isApproved !== undefined) query.isApproved = isApproved === "true";

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate("userId", "individualProfile.fullName phone")
        .populate("officeId", "name city")
        .sort({ createdAt: -1 })
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
    logger.error("Get reviews for moderation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get reviews",
    });
  }
};

export const approveReview = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    review.isApproved = isApproved;
    review.moderatedBy = req.user?.userId as any;
    review.moderatedAt = new Date();
    await review.save();

    await AdminLog.create({
      adminId: req.user?.userId,
      action: AdminActionType.MODERATE_REVIEW,
      target: {
        type: "review",
        id: review._id,
      },
      details: {
        newValues: { isApproved },
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(200).json({
      success: true,
      message: "Review moderation status updated successfully",
    });
  } catch (error) {
    logger.error("Approve review error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve review",
    });
  }
};

export const deleteReview = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    await Review.findByIdAndDelete(id);

    await AdminLog.create({
      adminId: req.user?.userId,
      action: AdminActionType.MODERATE_REVIEW,
      target: {
        type: "review",
        id: review._id,
      },
      details: {
        reason: "Review deleted by admin",
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
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

// Roles
export const updateUserRole = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { role, reason } = req.body;

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role provided",
        availableRoles: Object.values(UserRole),
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.id === req.user?.userId) {
      return res.status(403).json({
        success: false,
        message: "Cannot change your own role",
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await AdminLog.create({
      adminId: req.user?.userId,
      action: AdminActionType.CHANGE_USER_ROLE,
      target: {
        type: "user",
        id: user._id,
        name: user.individualProfile?.fullName || user.companyProfile?.nameAr || user.phone,
      },
      details: {
        oldValues: { role: oldRole },
        newValues: { role },
        reason,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(200).json({
      success: true,
      message: `User role changed from ${oldRole} to ${role} successfully`,
      data: {
        userId: user._id,
        oldRole,
        newRole: role,
      },
    });
  } catch (error) {
    logger.error("Update user role error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
};

export const bulkUpdateRoles = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { userIds, role, reason } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User IDs array is required",
      });
    }

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role provided",
        availableRoles: Object.values(UserRole),
      });
    }

    const filteredUserIds = userIds.filter(id => id !== req.user?.userId);
    if (filteredUserIds.length !== userIds.length) {
      return res.status(403).json({
        success: false,
        message: "Cannot change your own role in bulk update",
      });
    }

    const users = await User.find({ _id: { $in: filteredUserIds } });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid users found",
      });
    }

    const updatePromises = users.map(async (user) => {
      const oldRole = user.role;
      user.role = role;
      await user.save();
      return {
        userId: user._id,
        oldRole,
        newRole: role,
        name: user.individualProfile?.fullName || user.companyProfile?.nameAr || user.phone,
      };
    });

    const updatedUsers = await Promise.all(updatePromises);

    await AdminLog.create({
      adminId: req.user?.userId,
      action: AdminActionType.BULK_ROLE_UPDATE,
      target: {
        type: "users",
        id: null,
        count: updatedUsers.length,
      },
      details: {
        newValues: { role },
        reason,
        affectedUsers: updatedUsers,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(200).json({
      success: true,
      message: `Successfully updated role for ${updatedUsers.length} users to ${role}`,
      data: {
        updatedCount: updatedUsers.length,
        updates: updatedUsers,
      },
    });
  } catch (error) {
    logger.error("Bulk update roles error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to bulk update user roles",
    });
  }
};

export const getRoleHistory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 20, userId, actionType } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    query.action = { $in: [AdminActionType.CHANGE_USER_ROLE, AdminActionType.BULK_ROLE_UPDATE] };

    if (userId) query["target.id"] = userId;
    if (actionType) query.action = actionType;

    const [logs, total] = await Promise.all([
      AdminLog.find(query)
        .populate("adminId", "individualProfile.fullName phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AdminLog.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error("Get role history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get role history",
    });
  }
};

export const getRoleStatistics = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
          },
        },
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    const formattedStats = roleStats.reduce((acc: any, stat: any) => {
      acc[stat._id] = {
        total: stat.count,
        active: stat.active,
        inactive: stat.count - stat.active,
        percentage: ((stat.count / totalUsers) * 100).toFixed(2),
      };
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        statistics: formattedStats,
        totals: {
          allUsers: totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
        },
        availableRoles: Object.values(UserRole),
      },
    });
  } catch (error) {
    logger.error("Get role statistics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get role statistics",
    });
  }
};
