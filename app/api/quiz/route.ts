import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Pick a random index from 0 to i
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}
export async function GET() {
  try {
    // Fetch 10 questions from the daily_genai_quiz table
    const { data, error } = await supabase
      .from("daily_genai_quiz")
      .select("*")
      .filter(
        "created_at",
        "gte",
        new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      ) // Only include rows from the last 10 days
      .order("id", { ascending: false })
      .limit(10); // Limit to 10 rows

    if (error) {
      console.error("Error fetching questions:", error);
      return NextResponse.json(
        { error: "Failed to fetch questions." },
        { status: 500 }
      );
    }
    let shuffledQuestions = shuffleArray(data);

    if (data.length <= 9) {
      const { data, error } = await supabase
        .from("daily_genai_quiz")
        .select("*")
        .order("id", { ascending: false })
        .limit(10); // Limit to 10 rows

      if (error) {
        console.error("Error fetching questions:", error);
        return NextResponse.json(
          { error: "Failed to fetch questions." },
          { status: 500 }
        );
      }
      shuffledQuestions = shuffleArray(data);
    }

    return NextResponse.json(shuffledQuestions, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
