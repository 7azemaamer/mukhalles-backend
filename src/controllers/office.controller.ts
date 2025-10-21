import { Request, Response } from "express";
import { Office, Analytics } from "../models";
import { AuthRequest } from "../types";
import logger from "../utils/logger";

export const getOffices = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      city,
      category,
      featured,
      search,
      sortBy = "rating",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = { isActive: true };

    if (city) query.city = city;
    if (category) query.category = category;
    if (featured === "true") query.isFeatured = true;
    if (search) {
      query.$text = { $search: search as string };
    }

    const sortOptions: any = {};
    if (sortBy === "rating") sortOptions.rating = sortOrder === "asc" ? 1 : -1;
    if (sortBy === "created_at")
      sortOptions.createdAt = sortOrder === "asc" ? 1 : -1;
    if (sortBy === "featured_priority") {
      sortOptions.isFeatured = -1;
      sortOptions.featuredPriority = -1;
    }

    const [offices, total] = await Promise.all([
      Office.find(query)
        .select("-services -__v")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Office.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        offices,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error("Get offices error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get offices",
    });
  }
};

export const getOfficeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const office = await Office.findById(id).lean();

    if (!office) {
      return res.status(404).json({
        success: false,
        message: "Office not found",
      });
    }

    await Office.findByIdAndUpdate(id, { $inc: { "stats.profileViews": 1 } });

    await Analytics.create({
      metric: "office_views",
      value: 1,
      dimensions: {
        officeId: office._id,
        city: office.city,
        category: office.category,
      },
      timestamp: new Date(),
      granularity: "hour",
    });

    res.status(200).json({
      success: true,
      data: office,
    });
  } catch (error) {
    logger.error("Get office by id error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get office",
    });
  }
};

export const trackContactClick = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const office = await Office.findById(id);

    if (!office) {
      return res.status(404).json({
        success: false,
        message: "Office not found",
      });
    }

    await Office.findByIdAndUpdate(id, { $inc: { "stats.contactClicks": 1 } });

    await Analytics.create({
      metric: "contact_clicks",
      value: 1,
      dimensions: {
        officeId: office._id,
        city: office.city,
        category: office.category,
        userId: req.user?.userId,
      },
      timestamp: new Date(),
      granularity: "hour",
    });

    res.status(200).json({
      success: true,
      message: "Contact click tracked",
    });
  } catch (error) {
    logger.error("Track contact click error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track contact click",
    });
  }
};

export const updateOffice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const office = await Office.findOne({
      _id: id,
      companyId: req.user?.userId,
    });

    if (!office) {
      return res.status(404).json({
        success: false,
        message: "Office not found",
      });
    }

    const allowedUpdates = [
      "name",
      "city",
      "category",
      "summary",
      "address",
      "avatarUrl",
      "coverUrl",
      "licenseImageUrl",
      "contact",
      "socials",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        (office as any)[field] = updates[field];
      }
    });

    if (updates.location && updates.location.coordinates) {
      office.location = {
        type: "Point",
        coordinates: updates.location.coordinates,
      };
    }

    await office.save();

    res.status(200).json({
      success: true,
      message: "Office updated successfully",
      data: office,
    });
  } catch (error) {
    logger.error("Update office error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update office",
    });
  }
};
