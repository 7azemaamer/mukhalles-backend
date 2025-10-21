import { Response } from "express";
import { User, Office } from "../models";
import {
  AuthRequest,
  UploadStatus,
  UserRole,
  VerificationStatus,
} from "../types";
import logger from "../utils/logger";

export const registerCompany = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const {
      nameAr,
      nameEn,
      crNumber,
      vatNumber,
      city,
      nationalAddress,
      website,
      activity,
      licenseNumber,
      delegate,
    } = req.body;

    const user = await User.findById(req.user?.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingCompany = await User.findOne({
      "companyProfile.crNumber": crNumber,
    });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "Company with this CR number already exists",
      });
    }

    user.role = UserRole.COMPANY;
    user.companyProfile = {
      nameAr,
      nameEn,
      crNumber,
      vatNumber,
      city,
      nationalAddress,
      website,
      activity,
      licenseNumber,
      verificationStatus: VerificationStatus.PENDING,
      isFeatured: false,
      featuredPriority: 0,
      delegate,
      documents: [],
    };

    await user.save();

    await Office.create({
      companyId: user._id,
      name: nameAr,
      city,
      category: "other",
      rating: 0,
      ratingCount: 0,
      isFeatured: false,
      featuredPriority: 0,
      verified: false,
      contact: {
        phone: delegate.phone,
        whatsapp: delegate.whatsapp,
      },
      services: [],
      stats: {
        profileViews: 0,
        contactClicks: 0,
        bookmarks: 0,
      },
      isActive: false,
    });

    return res.status(201).json({
      success: true,
      message: "Company registered successfully. Awaiting verification.",
      data: user.companyProfile,
    });
  } catch (error) {
    logger.error("Register company error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register company",
    });
  }
};

export const getCompanyProfile = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const user = await User.findById(req.user?.userId);

    if (!user || !user.companyProfile) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        basicInfo: {
          nameAr: user.companyProfile.nameAr,
          nameEn: user.companyProfile.nameEn,
          crNumber: user.companyProfile.crNumber,
          vatNumber: user.companyProfile.vatNumber,
          city: user.companyProfile.city,
          nationalAddress: user.companyProfile.nationalAddress,
          website: user.companyProfile.website,
          activity: user.companyProfile.activity,
          licenseNumber: user.companyProfile.licenseNumber,
        },
        delegate: user.companyProfile.delegate,
        verificationStatus: user.companyProfile.verificationStatus,
        documents: user.companyProfile.documents,
      },
    });
  } catch (error) {
    logger.error("Get company profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get company profile",
    });
  }
};

export const updateCompanyProfile = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user?.userId);

    if (!user || !user.companyProfile) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found",
      });
    }

    const allowedUpdates = [
      "nameAr",
      "nameEn",
      "city",
      "nationalAddress",
      "website",
      "activity",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        (user.companyProfile as any)[field] = updates[field];
      }
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Company profile updated successfully",
      data: user.companyProfile,
    });
  } catch (error) {
    logger.error("Update company profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update company profile",
    });
  }
};

export const uploadCompanyDocument = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const user = await User.findById(req.user?.userId);

    if (!user || !user.companyProfile) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found",
      });
    }

    const fileUrl = `/uploads/documents/${req.file.filename}`;

    user.companyProfile.documents.push({
      documentType,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadStatus: "pending" as UploadStatus,
      uploadedBy: user.id!,
      uploadedAt: new Date(),
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        fileUrl,
        fileName: req.file.originalname,
      },
    });
  } catch (error) {
    logger.error("Upload company document error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload document",
    });
  }
};

export const getCompanyServices = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const office = await Office.findOne({ companyId: req.user?.userId });

    if (!office) {
      return res.status(404).json({
        success: false,
        message: "Office not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: office.services,
    });
  } catch (error) {
    logger.error("Get company services error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get services",
    });
  }
};

export const createService = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { title, description, basePrice, subServices, imageUrl } = req.body;

    const office = await Office.findOne({ companyId: req.user?.userId });

    if (!office) {
      return res.status(404).json({
        success: false,
        message: "Office not found",
      });
    }

    office.services.push({
      title,
      description,
      imageUrl,
      basePrice,
      isActive: true,
      subServices: subServices || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await office.save();

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: office.services[office.services.length - 1],
    });
  } catch (error) {
    logger.error("Create service error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create service",
    });
  }
};

export const updateService = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const office = await Office.findOne({ companyId: req.user?.userId });

    if (!office) {
      return res.status(404).json({
        success: false,
        message: "Office not found",
      });
    }

    const service = office.services.find((s) => s.id?.toString() === id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const allowedUpdates = [
      "title",
      "description",
      "basePrice",
      "subServices",
      "imageUrl",
      "isActive",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        (service as any)[field] = updates[field];
      }
    });

    (service as any).updatedAt = new Date();
    await office.save();

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: service,
    });
  } catch (error) {
    logger.error("Update service error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update service",
    });
  }
};

export const deleteService = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const office = await Office.findOne({ companyId: req.user?.userId });

    if (!office) {
      return res.status(404).json({
        success: false,
        message: "Office not found",
      });
    }

    office.services = office.services.filter((s) => s._id?.toString() !== id);
    await office.save();

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    logger.error("Delete service error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete service",
    });
  }
};

export const getDelegate = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const user = await User.findById(req.user?.userId);

    if (!user || !user.companyProfile) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user.companyProfile.delegate,
    });
  } catch (error) {
    logger.error("Get delegate error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get delegate information",
    });
  }
};

export const updateDelegate = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user?.userId);

    if (!user || !user.companyProfile) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found",
      });
    }

    const allowedUpdates = [
      "fullName",
      "position",
      "phone",
      "whatsapp",
      "email",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        (user.companyProfile!.delegate as any)[field] = updates[field];
      }
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Delegate information updated successfully",
      data: user.companyProfile.delegate,
    });
  } catch (error) {
    logger.error("Update delegate error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update delegate information",
    });
  }
};
