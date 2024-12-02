"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, Timer, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function QuizApp() {
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResults(false);
    setCurrentQuestion(0);
    setUserAnswers({});
    setTimer(0);
    setQuestionTimes([]);

    try {
      const response = await fetch("/api/py/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic, num_questions: numQuestions }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate questions");
      }

      const data = await response.json();
      setQuestions(JSON.parse(data).questions);
      setIsActive(true);
      toast.success("Quiz generated successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate questions. Please try again.");
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
    questions.forEach((q: any, index: number) => {
      if (userAnswers[index] === q.answer) correct++;
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

  const restartQuiz = () => {
    setQuestions(null);
    setShowResults(false);
    setCurrentQuestion(0);
    setUserAnswers({});
    setTimer(0);
    setQuestionTimes([]);
    setIsActive(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-2xl mx-auto'>
        <Card className='shadow-lg'>
          <CardHeader>
            <div className='flex items-center space-x-2'>
              <Brain className='w-6 h-6 text-blue-500' />
              <CardTitle>Interactive Quiz</CardTitle>
            </div>
            <CardDescription>
              Test your knowledge with our AI-generated quiz
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!questions ? (
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='space-y-2'>
                  <Label htmlFor='topic'>Quiz Topic</Label>
                  <Input
                    type='text'
                    id='topic'
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder='Enter your topic...'
                    className='w-full'
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='numQuestions'>Number of Questions</Label>
                  <Input
                    type='number'
                    id='numQuestions'
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    min='1'
                    max='20'
                    className='w-full'
                  />
                </div>

                <Button type='submit' className='w-full' disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Generating Quiz...
                    </>
                  ) : (
                    "Start Quiz"
                  )}
                </Button>
              </form>
            ) : showResults ? (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className='space-y-6'>
                    <div className='text-center'>
                      <h2 className='text-2xl font-bold mb-4'>Quiz Results</h2>
                      <div className='grid grid-cols-2 gap-4 mb-6'>
                        {Object.entries(calculateStats()).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className='bg-gray-50 p-4 rounded-lg'
                            >
                              <p className='text-sm text-gray-500 capitalize'>
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </p>
                              <p className='text-xl font-bold'>
                                {key.includes("Time")
                                  ? formatTime(value)
                                  : value}
                                {key === "percentage" && "%"}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className='space-y-4'>
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
                                userAnswers[index] === q.answer
                                  ? "text-green-600 font-medium"
                                  : "text-red-600 font-medium"
                              }
                            >
                              {userAnswers[index]}
                            </span>
                          </p>
                          {userAnswers[index] !== q.answer && (
                            <p className='mt-1 text-sm text-green-600'>
                              Correct answer: {q.answer}
                            </p>
                          )}
                          <p className='text-xs text-gray-500 mt-1'>
                            Time taken: {formatTime(questionTimes[index])}
                          </p>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={restartQuiz}
                      className='w-full'
                      variant='outline'
                    >
                      <RotateCcw className='w-4 h-4 mr-2' />
                      Start New Quiz
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <AnimatePresence mode='wait'>
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className='space-y-6'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-gray-500'>
                        Question {currentQuestion + 1} of {questions.length}
                      </span>
                      <div className='flex items-center space-x-2'>
                        <Timer className='w-4 h-4 text-gray-500' />
                        <span className='text-sm text-gray-500'>
                          {formatTime(timer)}
                        </span>
                      </div>
                    </div>

                    <Progress
                      value={((currentQuestion + 1) / questions.length) * 100}
                      className='h-2'
                    />

                    <div className='p-4 rounded-lg bg-gray-50 border border-gray-100'>
                      <p className='text-lg font-medium mb-4'>
                        {questions[currentQuestion].question}
                      </p>
                      <div className='space-y-2'>
                        {questions[currentQuestion].options.map(
                          (option: string) => (
                            <Button
                              key={option}
                              className='w-full text-left justify-start'
                              variant='outline'
                              onClick={() => handleAnswerSelect(option)}
                            >
                              {option}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
