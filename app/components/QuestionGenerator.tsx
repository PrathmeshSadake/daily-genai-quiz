"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Trophy, Clock, Brain, Target } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  question: string;
  options: { text: string; correct: string }[];
}

const Quiz = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isActive, setIsActive] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);

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
      if (!response.ok) throw new Error("Failed to fetch questions");
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
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion]: selectedOption,
    }));
    setQuestionTimes((prev) => [...prev, timer]);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setTimer(0);
    } else {
      setIsActive(false);
      setShowResults(true);
    }
  };

  const calculateStats = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      if (
        userAnswers[index] ===
        q.options.find((opt) => opt.correct === "true")?.text
      )
        correct++;
    });

    return {
      totalQuestions: questions.length,
      correctAnswers: correct,
      percentage: Math.round((correct / questions.length) * 100),
      totalTime: questionTimes.reduce((a, b) => a + b, 0),
      averageTime: Math.round(
        questionTimes.reduce((a, b) => a + b, 0) / questions.length
      ),
    };
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className='container mx-auto max-w-3xl py-8 px-4'>
      <Card className='mb-8'>
        <CardHeader>
          <CardTitle className='text-2xl text-center'>
            Interactive Quiz Challenge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Button
              type='submit'
              className='w-full'
              size='lg'
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                  Loading Quiz...
                </>
              ) : (
                "Start Quiz"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AnimatePresence mode='wait'>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='space-y-6'
          >
            <div className='flex items-center justify-between mb-4'>
              <span className='text-sm font-medium'>
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className='text-sm font-medium flex items-center'>
                <Clock className='w-4 h-4 mr-1' />
                {formatTime(timer)}
              </span>
            </div>

            <Progress
              value={(currentQuestion / questions.length) * 100}
              className='mb-6'
            />

            <Card>
              <CardContent className='pt-6'>
                <h2 className='text-xl font-semibold mb-4'>
                  {questions[currentQuestion].question}
                </h2>
                <div className='space-y-3'>
                  {questions[currentQuestion].options.map((option) => (
                    <Button
                      key={option.text}
                      className='w-full text-left justify-start h-auto py-4 px-6'
                      variant='outline'
                      onClick={() => handleAnswerSelect(option.text)}
                    >
                      {option.text}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='space-y-6'
          >
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Trophy className='h-6 w-6 text-yellow-500' />
                  Quiz Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
                  <Card>
                    <CardContent className='pt-6'>
                      <div className='text-center'>
                        <Target className='h-8 w-8 mb-2 mx-auto text-blue-500' />
                        <div className='text-2xl font-bold'>
                          {calculateStats().percentage}%
                        </div>
                        <p className='text-sm text-muted-foreground'>
                          Accuracy Rate
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className='pt-6'>
                      <div className='text-center'>
                        <Brain className='h-8 w-8 mb-2 mx-auto text-green-500' />
                        <div className='text-2xl font-bold'>
                          {calculateStats().correctAnswers}/
                          {calculateStats().totalQuestions}
                        </div>
                        <p className='text-sm text-muted-foreground'>
                          Correct Answers
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className='pt-6'>
                      <div className='text-center'>
                        <Clock className='h-8 w-8 mb-2 mx-auto text-purple-500' />
                        <div className='text-2xl font-bold'>
                          {formatTime(calculateStats().averageTime)}
                        </div>
                        <p className='text-sm text-muted-foreground'>
                          Avg. Time per Question
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className='space-y-4'>
                  {questions.map((q, index) => {
                    const isCorrect =
                      userAnswers[index] ===
                      q.options.find((opt) => opt.correct === "true")?.text;
                    return (
                      <Card
                        key={index}
                        className={`border-l-4 ${
                          isCorrect ? "border-l-green-500" : "border-l-red-500"
                        }`}
                      >
                        <CardContent className='pt-6'>
                          <p className='font-medium mb-2'>
                            {index + 1}. {q.question}
                          </p>
                          <p className='text-sm'>
                            Your answer:{" "}
                            <span
                              className={
                                isCorrect
                                  ? "text-green-600 font-medium"
                                  : "text-red-600 font-medium"
                              }
                            >
                              {userAnswers[index]}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p className='text-sm text-green-600 mt-1'>
                              Correct answer:{" "}
                              {
                                q.options.find((opt) => opt.correct === "true")
                                  ?.text
                              }
                            </p>
                          )}
                          <p className='text-xs text-muted-foreground mt-2'>
                            Time taken: {formatTime(questionTimes[index])}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Quiz;
