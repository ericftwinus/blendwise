import { getServerUser } from "@/lib/firebase/server-auth";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recipes = await prisma.savedRecipe.findMany({
    where: { userId: user.uid },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ recipes });
}

export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const recipe = await prisma.savedRecipe.create({
    data: {
      userId: user.uid,
      recipeName: body.recipeName,
      ingredients: body.ingredients,
      instructions: body.instructions || "",
      calories: body.calories,
      protein: body.protein,
      volumeMl: body.volumeMl,
      prepTime: body.prepTime,
      tags: body.tags || [],
    },
  });

  return NextResponse.json({ recipe });
}
