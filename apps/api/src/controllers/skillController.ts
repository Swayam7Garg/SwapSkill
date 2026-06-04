import { Request, Response } from "express";
import { prisma } from "../config/prisma.ts";
import { SkillCategory } from "@prisma/client";
import { z } from "zod";

const createSkillSchema = z.object({
  name: z.string().min(1),
  category: z.nativeEnum(SkillCategory),
});

export const listSkills = async (req: Request, res: Response) => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: {
        name: "asc",
      }
    });

    // Group skills by category
    const groupedSkills = skills.reduce((acc, skill) => {
      const cat = skill.category;
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(skill);
      return acc;
    }, {} as Record<SkillCategory, typeof skills>);

    return res.status(200).json({
      skills,
      grouped: groupedSkills,
    });
  } catch (error) {
    console.error("Error listing skills:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const createSkill = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const result = createSkillSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors });
    }

    const { name, category } = result.data;

    // Check if skill already exists (case insensitive)
    const existingSkill = await prisma.skill.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        category,
      }
    });

    if (existingSkill) {
      return res.status(400).json({ error: "A skill with this name already exists in this category." });
    }

    const newSkill = await prisma.skill.create({
      data: {
        name,
        category,
      }
    });

    return res.status(201).json(newSkill);
  } catch (error) {
    console.error("Error creating skill:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
