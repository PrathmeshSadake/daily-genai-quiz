"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Question {
  question: string;
  options: { text: string; correct: string }[];
}

const Quiz = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(0);
  const [userAnswers, setUserAnswers] = useState<any>({});
  const [isActive, setIsActive] = useState<any>(false);
  const [showResults, setShowResults] = useState<any>(false);
  const [loading, setLoading] = useState<any>(false);
  const [timer, setTimer] = useState<any>(0);
  const [questionTimes, setQuestionTimes] = useState<any>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResults(false);
    setCurrentQuestion(0);
    setUserAnswers({});
    setTimer(0);
    setQuestionTimes([]);

    try {
      const response = await fetch("/api/quiz");
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }

      const data = await response.json();
      setQuestions(data);
      setIsActive(true);
      toast.success("Quiz loaded successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (selectedOption: string) => {
    setUserAnswers((prev: any) => ({
      ...prev,
      [currentQuestion]: selectedOption,
    }));
    setQuestionTimes((prev: any) => [...prev, timer]);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev: any) => prev + 1);
      setTimer(0);
    } else {
      setIsActive(false);
      setShowResults(true);
    }
  };

  const calculateStats = () => {
    let correct = 0;
    questions.forEach((q: any, index: number) => {
      if (
        userAnswers[index] ===
        q.options.find((opt: any) => opt.correct === "true").text
      )
        correct++;
    });

    return {
      totalQuestions: questions.length,
      correctAnswers: correct,
      percentage: Math.round((correct / questions.length) * 100),
      totalTime: questionTimes.reduce((a: any, b: any) => a + b, 0),
      averageTime: Math.round(
        questionTimes.reduce((a: any, b: any) => a + b, 0) / questions.length
      ),
    };
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isActive) {
      interval = setInterval(() => {
        setTimer((prev: any) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className='p-4'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <Button type='submit' className='w-full' disabled={loading}>
          {loading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Loading Quiz...
            </>
          ) : (
            "Start Quiz"
          )}
        </Button>
      </form>

      {isActive && (
        <div className='mt-8'>
          <p className='text-lg font-medium mb-4'>
            {questions[currentQuestion].question}
          </p>
          <div className='space-y-2'>
            {questions[currentQuestion].options.map((option: any) => (
              <Button
                key={option.text}
                className='w-full text-left justify-start'
                variant='outline'
                onClick={() => handleAnswerSelect(option.text)}
              >
                {option.text}
              </Button>
            ))}
          </div>
          <p className='mt-2 text-sm'>Time: {formatTime(timer)}</p>
        </div>
      )}

      {showResults && (
        <div className='mt-8'>
          <h2 className='text-xl font-bold mb-4'>Results</h2>
          {questions.map((q: any, index: number) => (
            <div
              key={index}
              className='p-4 rounded-lg bg-gray-50 border border-gray-100'
            >
              <p className='font-medium'>
                {index + 1}. {q.question}
              </p>
              <p className='mt-2 text-sm'>
                Your answer:{" "}
                <span
                  className={
                    userAnswers[index] ===
                    q.options.find((opt: any) => opt.correct === "true").text
                      ? "text-green-600 font-medium"
                      : "text-red-600 font-medium"
                  }
                >
                  {userAnswers[index]}
                </span>
              </p>
              {userAnswers[index] !==
                q.options.find((opt: any) => opt.correct === "true").text && (
                <p className='mt-1 text-sm text-green-600'>
                  Correct answer:{" "}
                  {q.options.find((opt: any) => opt.correct === "true").text}
                </p>
              )}
              <p className='text-xs text-gray-500 mt-1'>
                Time taken: {formatTime(questionTimes[index])}
              </p>
            </div>
          ))}
          <div className='mt-4'>
            <h3>Summary</h3>
            <p>Total Questions: {calculateStats().totalQuestions}</p>
            <p>Correct Answers: {calculateStats().correctAnswers}</p>
            <p>Percentage: {calculateStats().percentage}%</p>
            <p>Total Time: {formatTime(calculateStats().totalTime)}</p>
            <p>Average Time: {formatTime(calculateStats().averageTime)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
