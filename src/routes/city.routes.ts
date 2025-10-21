import { Router, type Router as IRouter } from "express";

const router: IRouter = Router();

const cities = [
  { id: "riyadh", name: { ar: "الرياض", en: "Riyadh" }, isActive: true },
  { id: "jeddah", name: { ar: "جدة", en: "Jeddah" }, isActive: true },
  { id: "dammam", name: { ar: "الدمام", en: "Dammam" }, isActive: true },
  { id: "mecca", name: { ar: "مكة", en: "Mecca" }, isActive: true },
  { id: "medina", name: { ar: "المدينة", en: "Medina" }, isActive: true },
  { id: "khobar", name: { ar: "الخبر", en: "Khobar" }, isActive: true },
  { id: "tabuk", name: { ar: "تبوك", en: "Tabuk" }, isActive: true },
  { id: "abha", name: { ar: "أبها", en: "Abha" }, isActive: true },
];

router.get("/", (_req, res) => {
  return res.json({
    success: true,
    data: cities,
  });
});

export default router;
